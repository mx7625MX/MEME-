#!/usr/bin/env python3
import re

def fix_duplicate_sections(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到所有 "大V分析结果弹窗" 部分
    pattern = r'(/\* 大V分析结果弹窗 \*/.*?[\n\s]*\}\))'
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    # 只保留第一个
    if len(matches) > 1:
        # 反向删除
        for match in matches[:0:-1]:  # 从最后一个到第二个
            content = content[:match.start()] + content[match.end():]
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"原始长度: {len(content)}")
    print(f"删除的 大V分析结果弹窗: {len(matches) - 1}")

fix_duplicate_sections('src/app/page.tsx')
