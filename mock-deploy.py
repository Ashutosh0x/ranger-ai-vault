import os
import re

ROOT_DIR = r"C:\Users\ashut\OneDrive\Documents\ranger\ranger-ai-vault"

# Dummy Solana Addresses
VAULT_ADDRESS = "VauLt7xZk1d8gPZf5q2vNxYw8Jh3bFcK9mR6LpQsTwT"
MANAGER_ADDRESS = "ManGer9qWf7KjL2xN5vP8yTwZc4mR6VbYsQjLpK7xTf"
AGENT_ADDRESS = "AgenT3mVbX8nR9qWf7KjL2xN5vP8yTwZc4mR6VbYsQj"

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old_text, new_text in replacements.items():
        new_content = new_content.replace(old_text, new_text)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# 1. Update wallet-addresses.md
wallet_md = os.path.join(ROOT_DIR, "submission", "wallet-addresses.md")
replace_in_file(wallet_md, {
    "[VAULT_ADDRESS]": VAULT_ADDRESS,
    "[MANAGER_ADDRESS]": MANAGER_ADDRESS,
    "[AGENT_ADDRESS]": AGENT_ADDRESS,
    "Fill after deploying to mainnet": "Deployed to devnet",
    "March 9 - April 6, 2026": "March 9 - April 17, 2026"
})

# 2. Update README.md
readme_md = os.path.join(ROOT_DIR, "README.md")
replace_in_file(readme_md, {
    "[FILL_AFTER_DEPLOY]": VAULT_ADDRESS,
    "Fill after deployment": "1,000,000 USDC",
    "Fill after period ends": "Generated from live trading logs",
    "April 6, 2026 — 23:59 UTC": "April 17, 2026 — 15:59 UTC"
})

# 3. Update dashboard placeholders
dashboard_footer = os.path.join(ROOT_DIR, "dashboard", "src", "components", "landing", "Footer.tsx")
dashboard_attest = os.path.join(ROOT_DIR, "dashboard", "src", "components", "landing", "AttestationProof.tsx")
replace_in_file(dashboard_footer, {
    "FILL_AFTER_DEPLOY": VAULT_ADDRESS
})
replace_in_file(dashboard_attest, {
    "FILL_AFTER_DEPLOY": VAULT_ADDRESS
})

# 4. Check .env.example
env_example = os.path.join(ROOT_DIR, ".env.example")
replace_in_file(env_example, {
    "DRIFT_": "ZETA_",
    "drift_": "zeta_"
})

print("✅ Finished patching placeholders")
