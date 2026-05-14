#!/usr/bin/env python3
"""Fix welcome page colors: warm terracotta red-orange"""
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # CTA button: gold brown -> warm terracotta red-orange
    'background: linear-gradient(135deg, #8B6914, #C4941A);':
        'background: linear-gradient(135deg, #C75B3A, #E87B4F);',
    # CTA shadow
    'box-shadow: 0 6px 24px rgba(139,105,20,0.3);':
        'box-shadow: 0 6px 24px rgba(199,91,58,0.35);',
    'box-shadow: 0 10px 32px rgba(139,105,20,0.4);':
        'box-shadow: 0 10px 32px rgba(199,91,58,0.45);',
    # Logo glow
    'filter: drop-shadow(0 4px 12px rgba(61,52,40,0.18));':
        'filter: drop-shadow(0 4px 12px rgba(199,91,58,0.2));',
    # Prompt hover border
    'border-color: #8B6914;':
        'border-color: #C75B3A;',
    # Prompt hover bg
    'background: #FFF8E8;':
        'background: #FFF0EA;',
    # Prompt hover shadow
    'box-shadow: 0 2px 12px rgba(139,105,20,0.12);':
        'box-shadow: 0 2px 12px rgba(199,91,58,0.15);',
}

for old, new in replacements.items():
    if old in content:
        content = content.replace(old, new)
        print(f'[OK] replaced')
    else:
        print(f'[SKIP] {old[:50]}')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nDone! Warm terracotta red-orange applied.')
