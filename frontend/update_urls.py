import os

search_dir = r'c:\Users\Aaryan\Documents\coding\googlesol\frontend\src'
target = 'http://localhost:5002'

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if target in content:
                new_content = content.replace("'http://localhost:5002/api'", "(process.env.REACT_APP_API_URL || 'http://localhost:5002/api')")
                new_content = new_content.replace("'http://localhost:5002", "(process.env.REACT_APP_API_URL || 'http://localhost:5002') + '")
                new_content = new_content.replace("`http://localhost:5002", "`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}")
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')
