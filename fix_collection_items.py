#!/usr/bin/env python3
import re

with open('js/pages/profile.js', 'r') as f:
    content = f.read()

# Pattern to find collection-item-remove-inline
# This matches the template where there's a remove button
pattern = r'''(\s*<button\s+class="collection-item-remove-inline"\s+onclick="event\.stopPropagation\(\); ProfileManager\.removeFromCollection\([^)]+\)">.*?<\/button>\s*)(?!.*<button class="collection-item-add-inline")'''

# Replacement pattern that adds the add button
replacement = r'''\1
                                <button class="collection-item-add-inline" onclick="event.stopPropagation(); ProfileManager.addToCollection(\2, '\3', '\4', '\5')">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            '''

# Apply the replacement using a callback

def replace_callback(match):
    # Extract the parameters from the onclick handler
    onclick = match.group(0)
    params_match = re.search(r'ProfileManager\.removeFromCollection\(([^,]+),\s*\'([^\']+)\',\s*\'([^\']+)\',\s*\'([^\']+)\'', onclick)
    if params_match:
        itemId = params_match.group(1)
        listId = params_match.group(2)
        type = params_match.group(3)
        listType = params_match.group(4)
        
        # Build the add button
        add_button = f'''                                <button class="collection-item-add-inline" onclick="event.stopPropagation(); ProfileManager.addToCollection({itemId}, '{listId}', '{type}', '{listType}')">
                                    <i class="fas fa-plus"></i> Add
                                </button>'''
        
        # Insert the add button after the remove button
        lines = onclick.split('\n')
        new_lines = []
        for i, line in enumerate(lines):
            new_lines.append(line)
            if 'collection-item-remove-inline' in line and '</button>' in line:
                # Add the add button after the remove button
                new_lines.append(add_button)
        
        return '\n'.join(new_lines)
    return onclick

# Apply the replacement
content = re.sub(pattern, replace_callback, content, flags=re.DOTALL)

# Also apply to the bottom remove buttons (collection-item-remove class)

def replace_bottom_buttons(match):
    onclick = match.group(0)
    params_match = re.search(r'ProfileManager\.removeFromCollection\(([^,]+),\s*\'([^\']+)\',\s*\'([^\']+)\',\s*\'([^\']+)\'', onclick)
    if params_match:
        itemId = params_match.group(1)
        listId = params_match.group(2)
        type = params_match.group(3)
        listType = params_match.group(4)
        
        # Build the add button
        add_button = f'''                            <button class="collection-item-add" onclick="event.stopPropagation(); ProfileManager.addToCollection({itemId}, '{listId}', '{type}', '{listType}')">
                                <i class="fas fa-plus"></i>
                            </button>'''
        
        # Insert the add button after the remove button
        lines = onclick.split('\n')
        new_lines = []
        for i, line in enumerate(lines):
            new_lines.append(line)
            if 'collection-item-remove' in line and '</button>' in line and 'collection-item-remove-inline' not in line:
                # Add the add button after the remove button
                new_lines.append(add_button)
        
        return '\n'.join(new_lines)
    return onclick

# Apply the replacement to bottom buttons
pattern2 = r'''(\s*<button\s+class="collection-item-remove"\s+onclick="event\.stopPropagation\(\); ProfileManager\.removeFromCollection\([^)]+\)">.*?<\/button>\s*)'''

content = re.sub(pattern2, replace_bottom_buttons, content, flags=re.DOTALL)

with open('js/pages/profile.js', 'w') as f:
    f.write(content)

print("Applied fix to all collection item templates")