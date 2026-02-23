with open("app/services/rule_validator.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
    
print("📄 RuleValidator - load_scan_data method:\n")

in_method = False
for i, line in enumerate(lines):
    if "def load_scan_data" in line:
        in_method = True
    
    if in_method:
        print(f"{i+1}: {line}", end="")
        
        # Stop at next method
        if line.strip().startswith("async def ") and "load_scan_data" not in line:
            break
        if line.strip().startswith("def ") and "load_scan_data" not in line:
            break
