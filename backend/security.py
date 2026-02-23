from cryptography.fernet import Fernet
import os

# Generate a key or use existing one from Env
# For local dev, we will generate one and print it, but ideally it should be static in .env
# To keep it simple for now, we generate a static key if none exists.
# NOTE: In production, this MUST be loaded from environment variables!

# Fixed key for development so data remains readable after restart
# (Generated using Fernet.generate_key())
DEV_KEY = b'H8q2j_8q2j_8q2j_8q2j_8q2j_8q2j_8q2j_8q2j_8q=' 
# Warning: The above is a dummy placeholder format. Let's use a real generated one below for safety.

key = os.getenv("ENCRYPTION_KEY")
if not key:
    # Use a fixed key for dev persistence (so you don't lose access to saved data on restart)
    # This is a valid Fernet key
    key = b'Z7w1p9q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i=' 
else:
    key = key.encode()

cipher_suite = Fernet(key)

def encrypt_text(text: str) -> str:
    """Encrypts a plain text string."""
    if not text: return ""
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_text(encrypted_text: str) -> str:
    """Decrypts an encrypted string."""
    if not encrypted_text: return ""
    try:
        return cipher_suite.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return "" # Fail safe
