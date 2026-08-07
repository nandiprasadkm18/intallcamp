import os
import re

src_dir = r"c:\Users\nandi\OneDrive\Desktop\MajorProject\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace backticks
    content = re.sub(r'`http://127\.0\.0\.1:8000(.*?`|/.*?`)', r'`${import.meta.env.VITE_API_URL}\1', content)
    # For backticks, it matches up to the closing backtick. But the above regex is a bit flawed. 
    # Better: match http://127.0.0.1:8000 inside `...`
    # Since it's already inside `, we just replace the host part.
    content = content.replace('`http://127.0.0.1:8000', '`${import.meta.env.VITE_API_URL}')
    
    # Replace single quotes containing it with backticks
    content = re.sub(r"'http://127\.0\.0\.1:8000(.*?)'", r'`${import.meta.env.VITE_API_URL}\1`', content)
    
    # Replace double quotes containing it with backticks
    content = re.sub(r'"http://127\.0\.0\.1:8000(.*?)"', r'`${import.meta.env.VITE_API_URL}\1`', content)

    # Replace websockets
    content = content.replace('`ws://127.0.0.1:8000', '`${import.meta.env.VITE_WS_URL}')
    content = re.sub(r"'ws://127\.0\.0\.1:8000(.*?)'", r'`${import.meta.env.VITE_WS_URL}\1`', content)
    content = re.sub(r'"ws://127\.0\.0\.1:8000(.*?)"', r'`${import.meta.env.VITE_WS_URL}\1`', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            process_file(os.path.join(root, file))
            count += 1
print("Done processing files.")
