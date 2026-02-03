import os
import json
import urllib.request
import urllib.parse
import urllib.error
import ssl

# Vercel API Configuration
PROJECT_ID = "sarge"
VERCEL_TOKEN = "COk3jRbqh2xyBy90apGSdR61"

ENV_VARS = {
    "NEXTAUTH_SECRET": "/i7W2ZP4lWDvjhU/J152WiTCozW2+Ost4URnQXziQXQ=",
    "GITHUB_ID": "Ov23linESnwa4yLDNcr5",
    "GITHUB_SECRET": "ea8e506e5f522bf30f1713f17365769a02d7871b",
    "ALLOWED_ORIGINS": "https://v0-sarge.vercel.app",
    "FRONTEND_URL": "https://v0-sarge.vercel.app",
}

# Bypass SSL verification for this environment
context = ssl._create_unverified_context()

def update_env_var(key, value):
    print(f"Updating {key}...")
    
    headers = {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # 1. Check if it exists
    url = f"https://api.vercel.com/v9/projects/{PROJECT_ID}/env"
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, context=context) as res:
            data = json.loads(res.read().decode())
            envs = data.get("envs", [])
            existing_id = next((env["id"] for env in envs if env["key"] == key), None)
            
            if existing_id:
                print(f"  Found existing variable {key} ({existing_id}), removing first...")
                del_url = f"{url}/{existing_id}"
                del_req = urllib.request.Request(del_url, headers=headers, method="DELETE")
                with urllib.request.urlopen(del_req, context=context) as del_res:
                    pass
    except Exception as e:
        print(f"  Error checking/deleting {key}: {e}")
        return

    # 2. Add new value
    data = {
        "key": key,
        "value": value,
        "type": "encrypted",
        "target": ["production"]
    }
    
    body = json.dumps(data).encode("utf-8")
    add_req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(add_req, context=context) as add_res:
            print(f"  SUCCESSfully updated {key}")
    except Exception as e:
        print(f"  FAILED to update {key}: {e}")

if __name__ == "__main__":
    for key, val in ENV_VARS.items():
        update_env_var(key, val)
    print("\nDONE.")
