import json

# Read package.json and remove BOM
with open('C:\\Repositorios\\tfm-drones\\package.json', 'rb') as f:
    content = f.read()

# Remove BOM if present
if content.startswith(b'\xef\xbb\xbf'):
    content = content[3:]

# Write back
with open('C:\\Repositorios\\tfm-drones\\package.json', 'wb') as f:
    f.write(content)

print("BOM removed from package.json")
