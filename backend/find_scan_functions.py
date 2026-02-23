import os

# Find all function definitions in database.py
with open("app/core/database.py", "r", encoding="utf-8") as f:
    content = f.read()
    lines = content.split("\n")
    
print("📋 Functions in database.py:\n")
for i, line in enumerate(lines):
    if line.strip().startswith("async def ") or line.strip().startswith("def "):
        # Extract function name
        func_name = line.strip().split("(")[0].replace("async def ", "").replace("def ", "")
        if "scan" in func_name.lower():
            print(f"  ✅ Line {i+1}: {func_name}")
