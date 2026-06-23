#python3 -c "
import json
data = json.load(open('/Users/Nagendra/Projects/claude/samskruti/data/stotrams.json'))
tags = set()
items = data if isinstance(data, list) else data.get('stotrams', data.get('items', []))
for s in items:
    if isinstance(s, dict): tags.update(s.get('tags',[]))
print(len(tags), 'tags')
print(sorted(tags))
#"
