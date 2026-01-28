#!/usr/bin/env python3
import re

def remove_duplicate_tabscontent(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    tabs_pattern = r'TabsContent value="([^"]+)"'
    seen_values = set()
    keep_lines = []
    skip_until = None
    
    for i, line in enumerate(lines):
        if skip_until is not None:
            if i < skip_until:
                continue
            else:
                skip_until = None
        
        match = re.search(tabs_pattern, line)
        if match:
            value = match.group(1)
            if value in seen_values:
                depth = 1
                for j in range(i + 1, len(lines)):
                    if 'TabsContent' in lines[j]:
                        depth += 1
                    elif '</TabsContent>' in lines[j]:
                        depth -= 1
                        if depth == 0:
                            skip_until = j + 1
                            break
            else:
                seen_values.add(value)
                keep_lines.append(line)
        else:
            keep_lines.append(line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(keep_lines)
    
    print(f"原始行数: {len(lines)}")
    print(f"处理后行数: {len(keep_lines)}")
    print(f"删除行数: {len(lines) - len(keep_lines)}")
    print(f"保留的 TabsContent: {seen_values}")

remove_duplicate_tabscontent('src/app/page.tsx')
