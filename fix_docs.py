import os

ROOT_DIR = r"C:\Users\ashut\OneDrive\Documents\ranger\ranger-ai-vault"
SKIP_DIRS = {".git", "node_modules", "venv", ".venv", ".next"}

def fix_artifacts(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    # Fix Zeta Markets name and URLs
    new_content = content.replace("docs.zeta.trade", "docs.zeta.markets")
    new_content = new_content.replace("zeta.trade", "zeta.markets")
    new_content = new_content.replace("Zeta Protocol", "Zeta Markets")
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed docs artifacts in {filepath}")

for root, dirs, files in os.walk(ROOT_DIR):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
    for file in files:
        filepath = os.path.join(root, file)
        if filepath.endswith(('.ts', '.tsx', '.md', '.html', '.yaml', '.yml', '.json', '.txt')):
            fix_artifacts(filepath)

print("✅ Finished documentation cleanup")
