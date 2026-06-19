import os
import re

base = r'c:\Users\gabri\Music\Proyecto-El-Valle-FS\frontend\src'

def process_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Replace bg-gradient-to-br
    new_content = new_content.replace('bg-gradient-to-br', 'bg-linear-to-br')
    # Replace z-[100]
    new_content = new_content.replace('z-[100]', 'z-100')
    
    # Remove block if flex is in className
    def remove_block(match):
        cls = match.group(1)
        if 'flex' in cls.split() and 'block' in cls.split():
            # remove block
            cls = re.sub(r'\bblock\b\s*', '', cls)
            return 'className="' + cls + '"'
        return match.group(0)

    # For JSX className="..."
    new_content = re.sub(r'className="([^"]+)"', remove_block, new_content)
    
    # For JSX className={`...`}
    def remove_block_template(match):
        cls = match.group(1)
        if re.search(r'\bflex\b', cls) and re.search(r'\bblock\b', cls):
            cls = re.sub(r'\bblock\b\s*', '', cls)
            return 'className={`' + cls + '`}'
        return match.group(0)
        
    new_content = re.sub(r'className=\{`([^`]+)`\}', remove_block_template, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed {filepath}')

for root, _, files in os.walk(base):
    for file in files:
        if file.endswith(('.jsx', '.css')):
            process_file(os.path.join(root, file))
