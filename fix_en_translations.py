import json

with open('public/locales/en/translation.json', 'r') as f:
    data = json.load(f)

for key in data:
    data[key] = key  # Set value to the key itself for English

with open('public/locales/en/translation.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
