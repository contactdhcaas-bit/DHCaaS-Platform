import os
import json
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "eu-west-3")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Check if AWS credentials are provided
USE_MOCK_AWS = not (AWS_ACCESS_KEY and AWS_SECRET_KEY and AWS_ACCESS_KEY != "YOUR_AWS_ACCESS_KEY_ID")

class SecretsManagerClient:
    def __init__(self):
        if USE_MOCK_AWS:
            print("⚠️ AWS credentials not found. Using MOCK Secrets Manager (In-Memory).")
            self.client = None
            self._mock_storage = {}
        else:
            print("🔒 Initializing AWS Secrets Manager Client...")
            self.client = boto3.client(
                "secretsmanager",
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=AWS_SECRET_KEY,
            )

    def create_secret(self, name: str, secret_data: dict) -> str:
        """
        Creates a new secret. Returns the ARN (Amazon Resource Name).
        """
        secret_string = json.dumps(secret_data)
        
        if USE_MOCK_AWS:
            # Mock behavior: Store in memory and return a fake ARN
            self._mock_storage[name] = secret_string
            fake_arn = f"arn:aws:secretsmanager:{AWS_REGION}:123456789012:secret:{name}-mock"
            print(f"🔹 [MOCK] Secret created: {name}")
            return fake_arn

        try:
            response = self.client.create_secret(
                Name=name,
                SecretString=secret_string,
                Description="Created by DHCaaS Backend"
            )
            return response["ARN"]
        except ClientError as e:
            # If secret exists, try updating it or return existing ARN
            if e.response['Error']['Code'] == 'ResourceExistsException':
                print(f"⚠️ Secret {name} already exists.")
                # Optional: Logic to update or retrieve existing ARN could go here
                return f"arn:aws:secretsmanager:{AWS_REGION}:...:secret:{name}" 
            print(f"❌ AWS Error: {e}")
            raise e

    def get_secret(self, secret_id: str) -> dict:
        """
        Retrieves a secret value by ARN or Name.
        """
        if USE_MOCK_AWS:
            # Mock behavior: Extract name from mock ARN or use ID directly
            # For simplicity in mock, we iterate or assume secret_id is the key if simpler
            # Here we just try to find the value if stored
            for name, value in self._mock_storage.items():
                if name in secret_id: # Simple matching for mock ARN
                    return json.loads(value)
            print(f"❌ [MOCK] Secret not found: {secret_id}")
            return None

        try:
            response = self.client.get_secret_value(SecretId=secret_id)
            if "SecretString" in response:
                return json.loads(response["SecretString"])
            else:
                # Binary secrets are not supported in this basic implementation
                return {}
        except ClientError as e:
            print(f"❌ AWS Error getting secret: {e}")
            raise e

# Create a singleton instance
secrets_client = SecretsManagerClient()
