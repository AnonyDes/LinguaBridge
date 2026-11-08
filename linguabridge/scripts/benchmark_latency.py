import time
import json
import urllib.request

texts = [
    ('ewo-CM', 'Mbólo, móni wá á ne mvaé'),
    ('ewo-CM', 'Mbólo, móni wá á ne mvaé'), # second time (cache or warm)
    ('ewo-CM', 'Bienvenue sur la plateforme Nayokan pour apprendre les langues et technologies africaines en toute sérénité.'),
    ('hau-CM', 'Barka da zuwa shafin yanar gizo na banki domin yin duk wani hada-hadar kudi cikin sauki da aminci.'),
    ('fuv-CM', 'Jam waali e kooje fuu, en ngoodi heɓugo seede e laawol kesol ngol hokkata jam.'),
]

for lang, t in texts:
    t0 = time.time()
    req = urllib.request.Request(
        'http://127.0.0.1:3002/synthesize',
        data=json.dumps({'text': t, 'lang': lang}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    elapsed = (time.time() - t0) * 1000
    print(f"[{lang}] Elapsed: {elapsed:6.1f}ms | Text len: {len(t):3} | Engine: {data.get('engine')}")
