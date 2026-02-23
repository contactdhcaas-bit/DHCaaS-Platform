"""
DHCaaS Platform - AI Auto-Tagger Test Suite
Tests the AI classification engine with realistic data
"""

import pandas as pd
import json
from ai_classifier import AIAutoTagger


def create_test_dataset():
    """
    Create a realistic test dataset with various data types
    """
    data = {
        'customer_id': [1001, 1002, 1003, 1004, 1005],
        'customer_email': [
            'ahmed.benali@gmail.com',
            'fatima.alaoui@outlook.com',
            'youssef.idrissi@yahoo.fr',
            'sofia.chakir@hotmail.com',
            'karim.tazi@gmail.com'
        ],
        'phone_number': [
            '+212 6 12 34 56 78',
            '+212 7 23 45 67 89',
            '+212 6 98 76 54 32',
            '+212 5 11 22 33 44',
            '+212 6 55 44 33 22'
        ],
        'cin_number': [
            'AB123456',
            'CD789012',
            'EF345678',
            'GH901234',
            'IJ567890'
        ],
        'account_balance': [
            '€1,250.50',
            '€3,890.00',
            '€567.25',
            '€12,450.80',
            '€890.00'
        ],
        'registration_date': [
            '2025-01-15',
            '2025-02-03',
            '2025-01-28',
            '2025-02-07',
            '2025-01-20'
        ],
        'city': [
            'Casablanca',
            'Rabat',
            'Marrakech',
            'Fes',
            'Tangier'
        ],
        'is_active': [
            True,
            True,
            False,
            True,
            True
        ],
        'total_revenue': [
            2450.75,
            5890.50,
            1250.00,
            8900.25,
            3450.80
        ],
        'ip_address': [
            '192.168.1.100',
            '10.0.0.25',
            '172.16.5.50',
            '192.168.0.1',
            '10.10.10.10'
        ],
        'website': [
            'https://example.com',
            'https://test.ma',
            'https://demo.com',
            'https://sample.fr',
            'https://website.com'
        ]
    }
    
    return pd.DataFrame(data)


def test_single_column():
    """
    Test analyzing a single column
    """
    print("="*80)
    print("TEST 1: Single Column Analysis")
    print("="*80)
    
    tagger = AIAutoTagger()
    
    # Test email detection
    emails = [
        'john.doe@example.com',
        'sarah.smith@company.co.uk',
        'ahmed@test.ma',
        'maria@gmail.com',
        'test@outlook.fr'
    ]
    
    result = tagger.analyze_column('contact_email', emails)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()


def test_full_dataset():
    """
    Test analyzing an entire dataset
    """
    print("="*80)
    print("TEST 2: Full Dataset Scan")
    print("="*80)
    
    # Create test dataset
    df = create_test_dataset()
    
    print(f"Dataset Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print()
    
    # Run AI Auto-Tagger
    tagger = AIAutoTagger()
    results = tagger.scan_dataset(df)
    
    # Pretty print results
    print("="*80)
    print("DATASET SUMMARY")
    print("="*80)
    print(json.dumps(results['dataset_summary'], indent=2))
    print()
    
    print("="*80)
    print("COLUMN ANALYSIS RESULTS")
    print("="*80)
    for col_result in results['columns']:
        print(f"\n📊 Column: {col_result['name']}")
        print(f"   Type: {col_result['detected_type']}")
        print(f"   Tags: {', '.join(col_result['tags']) if col_result['tags'] else 'None'}")
        print(f"   Confidence: {col_result['confidence_score']}%")
        print(f"   Description: {col_result['ai_description']}")


def test_moroccan_data():
    """
    Test Moroccan-specific data formats
    """
    print("\n" + "="*80)
    print("TEST 3: Moroccan Data Format Detection")
    print("="*80)
    
    tagger = AIAutoTagger()
    
    # Test Moroccan phone numbers
    moroccan_phones = [
        '+212 6 12 34 56 78',
        '+212612345678',
        '0612345678',
        '+212 7 98 76 54 32',
        '+212512345678'
    ]
    
    phone_result = tagger.analyze_column('telephone_mobile', moroccan_phones)
    print("\n📱 Moroccan Phone Numbers:")
    print(json.dumps(phone_result, indent=2, ensure_ascii=False))
    
    # Test Moroccan CIN
    cin_numbers = ['AB123456', 'CD789012', 'EF345678', 'GH901234', 'IJ567890']
    cin_result = tagger.analyze_column('numero_cin', cin_numbers)
    print("\n🆔 Moroccan National ID (CIN):")
    print(json.dumps(cin_result, indent=2, ensure_ascii=False))


def test_sensitive_data_detection():
    """
    Test detection of sensitive PII and financial data
    """
    print("\n" + "="*80)
    print("TEST 4: Sensitive Data Detection")
    print("="*80)
    
    tagger = AIAutoTagger()
    
    # Test credit card detection
    credit_cards = [
        '4532015112830366',  # Visa
        '5425233430109903',  # Mastercard
        '374245455400126',   # Amex
        '6011000991300009',  # Discover
    ]
    
    cc_result = tagger.analyze_column('payment_method', credit_cards)
    print("\n💳 Credit Card Detection:")
    print(json.dumps(cc_result, indent=2, ensure_ascii=False))
    
    # Test IBAN detection
    ibans = [
        'GB82WEST12345698765432',
        'DE89370400440532013000',
        'FR1420041010050500013M02606',
        'ES9121000418450200051332'
    ]
    
    iban_result = tagger.analyze_column('bank_account', ibans)
    print("\n🏦 IBAN Detection:")
    print(json.dumps(iban_result, indent=2, ensure_ascii=False))


def run_all_tests():
    """
    Execute all test suites
    """
    print("\n" + "🚀"*40)
    print("DHCaaS AI AUTO-TAGGER - COMPREHENSIVE TEST SUITE")
    print("🚀"*40 + "\n")
    
    test_single_column()
    test_full_dataset()
    test_moroccan_data()
    test_sensitive_data_detection()
    
    print("\n" + "✅"*40)
    print("ALL TESTS COMPLETED SUCCESSFULLY")
    print("✅"*40 + "\n")


if __name__ == "__main__":
    run_all_tests()
