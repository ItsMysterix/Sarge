import base64
import pathlib
import secrets
import subprocess

# read github creds from .env.local
vals = {}
p = pathlib.Path('.env.local')
for line in p.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    k, v = line.split('=', 1)
    vals[k.strip()] = v.strip().strip('"')

github_id = vals.get('GITHUB_ID', '')
github_secret = vals.get('GITHUB_SECRET', '')

# set NEXTAUTH_URL
subprocess.run(["vercel", "env", "rm", "NEXTAUTH_URL", "production", "-y"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run(["vercel", "env", "add", "NEXTAUTH_URL", "production"], input="https://v0-sarge.vercel.app\n", text=True)

# set NEXTAUTH_SECRET (new)
nextauth_secret = base64.b64encode(secrets.token_bytes(32)).decode()
subprocess.run(["vercel", "env", "rm", "NEXTAUTH_SECRET", "production", "-y"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run(["vercel", "env", "add", "NEXTAUTH_SECRET", "production"], input=nextauth_secret + "\n", text=True)

# set GitHub OAuth creds if present
if github_id:
    subprocess.run(["vercel", "env", "rm", "GITHUB_ID", "production", "-y"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["vercel", "env", "add", "GITHUB_ID", "production"], input=github_id + "\n", text=True)
if github_secret:
    subprocess.run(["vercel", "env", "rm", "GITHUB_SECRET", "production", "-y"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["vercel", "env", "add", "GITHUB_SECRET", "production"], input=github_secret + "\n", text=True)

print("Updated NEXTAUTH_URL and NEXTAUTH_SECRET in production.")
print("Updated GitHub OAuth creds in production.")
