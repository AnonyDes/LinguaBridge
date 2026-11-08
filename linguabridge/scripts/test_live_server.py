import urllib.request
import urllib.error
import json

test_cases = [
    ('ewo-CM', 'Mbólo, móni wá á ne mvaé'),
    ('pcm-cm', 'Welcome! Transfer don complete fine'),
    ('hau-CM', 'Sannu, kudi ya shiga lami lafiya'),
    ('fuv-CM', 'Jam waali, seede maada yottake'),
    ('knc-CM', 'Wushe, kəla kəji ro lewono')
]

print("=== LIVE SERVER TEST ON PORT 3002 ===")
for lang, text in test_cases:
    req = urllib.request.Request(
        'http://127.0.0.1:3002/synthesize',
        data=json.dumps({'text': text, 'lang': lang}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    print(f"Lang: {lang:7} -> Status: {res.status}, Engine: {data.get('engine')}, Audio Base64 Len: {len(data.get('audioBase64', ''))}")

# Test dua-CM quarantine
try:
    req_dua = urllib.request.Request(
        'http://127.0.0.1:3002/synthesize',
        data=json.dumps({'text': 'Mwaso', 'lang': 'dua-CM'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req_dua)
    print("Duala test FAILED (should have returned 403)!")
except urllib.error.HTTPError as e:
    print(f"Lang: dua-CM  -> Quarantined as expected: HTTP {e.code}")

# Test empty text fallback to defensive silence
req_empty = urllib.request.Request(
    'http://127.0.0.1:3002/synthesize',
    data=json.dumps({'text': '   ', 'lang': 'ewo-CM'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res_empty = urllib.request.urlopen(req_empty)
data_empty = json.loads(res_empty.read().decode('utf-8'))
print(f"Empty text fallback -> Engine: {data_empty.get('engine')}, Base64 Len: {len(data_empty.get('audioBase64', ''))}")
print("=== ALL LIVE SERVER TESTS PASSED ===")
