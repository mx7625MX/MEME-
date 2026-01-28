#!/usr/bin/env python3
import re

def fix_duplicate_tabscontent(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到所有 TabsContent 的位置
    pattern = r'(<TabsContent value="([^"]+)"[^>]*>.*?</TabsContent>)'
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    seen = set()
    keep_ranges = []
    
    for match in matches:
        value = match.group(2)
        if value not in seen:
            seen.add(value)
            keep_ranges.append((match.start(), match.end()))
    
    # 找到需要删除的部分
    delete_ranges = []
    for match in matches:
        value = match.group(2)
        if value in seen:
            seen.remove(value)
        else:
            # 这是一个重复的，标记为删除
            delete_ranges.append((match.start(), match.end()))
    
    # 反向删除，避免位置偏移
    for start, end in sorted(delete_ranges, reverse=True):
        content = content[:start] + content[end:]
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"原始长度: {len(content)}")
    print(f"删除的 TabsContent: {len(delete_ranges)}")

fix_duplicate_tabscontent('src/app/page.tsx')
