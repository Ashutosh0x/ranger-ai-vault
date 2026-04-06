import os
import glob
import re

ROOT_DIR = r"C:\Users\ashut\OneDrive\Documents\ranger\ranger-ai-vault"
SKIP_DIRS = {".git", "node_modules", "venv", ".venv", ".next"}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    # Replacements
    new_content = content.replace("Zeta Markets", "Zeta Markets")
    new_content = new_content.replace("@zetamarkets/sdk", "@zetamarkets/sdk")
    new_content = new_content.replace("Zeta", "Zeta")
    new_content = new_content.replace("zeta_", "zeta_")
    new_content = new_content.replace("zeta-", "zeta-")
    new_content = new_content.replace("ZETA_", "ZETA_")
    new_content = new_content.replace("zeta", "zeta")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated content in {filepath}")

def rename_file(filepath):
    dir_name = os.path.dirname(filepath)
    base_name = os.path.basename(filepath)
    
    new_base_name = base_name.replace("zeta", "zeta").replace("Zeta", "Zeta")
    if new_base_name != base_name:
        new_filepath = os.path.join(dir_name, new_base_name)
        os.rename(filepath, new_filepath)
        print(f"Renamed {base_name} to {new_base_name}")
        return new_filepath
    return filepath

for root, dirs, files in os.walk(ROOT_DIR):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
    for file in files:
        filepath = os.path.join(root, file)
        
        # extensions to process
        if filepath.endswith(('.ts', '.js', '.json', '.py', '.md', '.sh', '.yml', '.yaml', '.txt', '.tsx', '.jsx', '.html', '.css', '.env.example')):
            replace_in_file(filepath)
            rename_file(filepath)
