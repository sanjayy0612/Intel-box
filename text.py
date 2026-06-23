# test_searx.py

import requests

r = requests.get(
    "http://localhost:8080/search",
    params={"q": "nike"}
)

print(r.status_code)
print(r.text[:500])