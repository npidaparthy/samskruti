#python3 -c "
import json
from collections import Counter
data = json.load(open('/Users/Nagendra/Projects/claude/samskruti/data/stotrams.json'))
items = data if isinstance(data, list) else list(data.values())[0]
c = Counter()
for s in items:
    if isinstance(s, dict):
        for t in s.get('tags',[]): c[t]+=1
for t,n in sorted(c.items(), key=lambda x:-x[1]): print(n, t)
#"
