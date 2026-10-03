import os
import uuid
import unittest
from concurrent.futures import ThreadPoolExecutor
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import DuplicateKeyError
from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern

URI = os.environ.get("MONGO_TEST_URI", "mongodb://localhost:27017/?replicaSet=rs0")
TXN = dict(read_concern=ReadConcern("snapshot"), write_concern=WriteConcern("majority"))

class TestMongoTransactions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = MongoClient(URI, serverSelectionTimeoutMS=5000)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def setUp(self):
        self.db_name = f"dhcaas_txn_smoke_{uuid.uuid4().hex[:12]}"
        self.db = self.client[self.db_name]
        self.db.create_collection("incidents")
        self.db.create_collection("audit")
        self.db.create_collection("audit_heads")
        self.db["audit"].create_index([("tenant_id", 1), ("seq", 1)], unique=True)

    def tearDown(self):
        self.client.drop_database(self.db_name)

    def test_1_replica_set_and_version(self):
        hello = self.client.admin.command("hello")
        self.assertTrue(hello.get("setName"), "standalone server: transactions unavailable")
        self.assertTrue(hello.get("isWritablePrimary"))
        version = self.client.admin.command("buildInfo")["versionArray"]
        print(f"\n[INFO] Detected MongoDB Version: {version}, ReplicaSet: {hello.get('setName')}")
        self.assertGreaterEqual(tuple(version[:2]), (7, 0), f"MongoDB >= 7.0 required, got {version}")

    def test_2_commit_is_visible(self):
        def cb(s):
            self.db.incidents.insert_one({"_id": "inc1", "tenant_id": "t1", "state": "open"}, session=s)
            self.db.audit.insert_one({"tenant_id": "t1", "seq": 1}, session=s)

        with self.client.start_session() as s:
            s.with_transaction(cb, **TXN)
        self.assertEqual(self.db.incidents.count_documents({"_id": "inc1"}), 1)
        self.assertEqual(self.db.audit.count_documents({"tenant_id": "t1", "seq": 1}), 1)

    def test_3_rollback_leaves_nothing(self):
        def cb(s):
            self.db.incidents.insert_one({"_id": "inc2", "tenant_id": "t1"}, session=s)
            raise RuntimeError("force abort")

        with self.client.start_session() as s:
            with self.assertRaises(RuntimeError):
                s.with_transaction(cb, **TXN)
        self.assertEqual(self.db.incidents.count_documents({}), 0)

    def test_4_incident_and_audit_are_atomic(self):
        self.db.audit.insert_one({"tenant_id": "t1", "seq": 1})

        def cb(s):
            self.db.incidents.update_one({"_id": "inc3", "tenant_id": "t1"},
                                    {"$set": {"state": "acknowledged"}}, upsert=True, session=s)
            self.db.audit.insert_one({"tenant_id": "t1", "seq": 1}, session=s)

        with self.client.start_session() as s:
            with self.assertRaises(DuplicateKeyError):
                s.with_transaction(cb, **TXN)
        self.assertEqual(self.db.incidents.count_documents({"_id": "inc3"}), 0)

    def test_5_concurrent_audit_appends_have_no_gaps(self):
        self.db.audit_heads.insert_one({"_id": "t1", "seq": 0})

        def append(_):
            def cb(s):
                head = self.db.audit_heads.find_one_and_update(
                    {"_id": "t1"}, {"$inc": {"seq": 1}},
                    return_document=ReturnDocument.AFTER, session=s)
                self.db.audit.insert_one({"tenant_id": "t1", "seq": head["seq"]}, session=s)
                return head["seq"]
            with self.client.start_session() as s:
                return s.with_transaction(cb, **TXN)

        with ThreadPoolExecutor(max_workers=8) as pool:
            seqs = sorted(pool.map(append, range(8)))
        self.assertEqual(seqs, list(range(1, 9)))
        self.assertEqual(self.db.audit.count_documents({"tenant_id": "t1"}), 8)

if __name__ == "__main__":
    unittest.main()
