import sys
import os

sys.path.append(os.getcwd())

print("🔍 Attempting to import app.main...")

try:
    from app import main
    print("✅ Success! app.main imported correctly.")
except Exception as e:
    print("\n❌ FATAL ERROR:")
    import traceback
    traceback.print_exc()
