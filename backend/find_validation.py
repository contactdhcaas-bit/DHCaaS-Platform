import sys
sys.path.insert(0, ".")

# Find validation logic
import os
for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                if "def validate_dataset" in content or "class RulesService" in content:
                    print(f"\n📄 Found in: {filepath}")
                    # Print relevant lines
                    lines = content.split("\n")
                    for i, line in enumerate(lines):
                        if "validate" in line.lower() and "def " in line:
                            print(f"\nLine {i}: {line}")
                            # Print next 20 lines
                            for j in range(i, min(i+20, len(lines))):
                                print(f"{j}: {lines[j]}")
                            break
