import sys
sys.path.insert(0, ".")

from app.main import app

print("📋 Available Routes:")
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        methods = ", ".join(route.methods)
        print(f"  {methods:20} {route.path}")
