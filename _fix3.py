#!/usr/bin/env python3
import sys
with open('index.html','r',encoding='utf-8') as f: lines=f.readlines()
start = None
for i in range(len(lines)):
    if start is None and 'function extractKeywords(text)' in lines[i]:
        start = i
if start is None:
    print('ERROR: function not found', file=sys.stderr)
    sys.exit(1)

# Find end: "return ranked" then "}"
end = None
for i in range(start+1, len(lines)):
    if lines[i].strip() == 'return ranked' and i+1 < len(lines) and lines[i+1].strip() == '}':
        end = i + 1
        break

if end is None:
    print(f'ERROR: end not found, start={start}', file=sys.stderr)
    sys.exit(1)

print(f'Replacing lines {start+1} to {end+1} ({end-start+1} lines)', file=sys.stderr)

new_func = """function extractKeywords(text) {
  if (!text) return []

  const segmented = segmentText(text)
  const engTerms = (text.match(/[a-zA-Z]{2,}(?:[a-zA-Z0-9]*)/g) || [])
    .map(w => { const c = w.replace(/[^a-zA-Z]$/, ''); return c.length >= 2 ? c : null })
    .filter(Boolean)
    .map(w => ({ word: w, isDict: DICT.has(w) || DICT.has(w.toLowerCase()), isEng: true }))
  const numCnTerms = []
  const ncMatches = text.match(/\\d+[一二三四五六七八九十百千万亿]*[\\u4e00-\\u9fa5]+|[一二三四五六七八九十百千万亿]+\\d*[\\u4e00-\\u9fa5]+/g)
  if (ncMatches) ncMatches.forEach(m => { if (m.length >= 2 && m.length <= 6 && !STOP_WORDS.has(m)) numCnTerms.push({ word: m, isDict: DICT.has(m), isEng: false }) })
  const allCandidates = [...segmented, ...engTerms, ...numCnTerms]

  const filtered = allCandidates.filter(c => {
    if (STOP_WORDS.has(c.word) || c.word.length < 2) return false
    if (/^\\u7684.+$/u.test(c.word) && !DICT.has(c.word)) return false
    if (/^.+\\u4e86$/u.test(c.word) && !DICT.has(c.word) && c.word.length <= 3) return false
    if (/^(\\u6211|\\u4f60|\\u4ed6|\\u5979|\\u5b83|\\u8fd9|\\u90a3|\\u54ea)[\\u662f\\u5728\\u4e86\\u6709\\u5bf9\\u628a\\u88ab\\u8ba9\\u7ed9\\u4ece\\u5411]/.test(c.word)) return false
    return true
  })
  if (filtered.length === 0) return []

  const wordInfo = new Map()
  filtered.forEach((c, idx) => {
    const key = c.word.toLowerCase()
    if (!wordInfo.has(key)) wordInfo.set(key, { word: c.word, count: 0, firstPos: idx, dictBonus: c.isDict ? 8 : 0, len: c.word.length, isEng: !!c.isEng })
    const info = wordInfo.get(key); info.count++
    if (c.isDict) info.dictBonus += 2
    if (c.isEng) info.engBonus = (info.engBonus || 0) + 1
  })

  const scored = Array.from(wordInfo.values()).map(info => ({ word: info.word, score: info.count * 3 + info.dictBonus + info.len * 0.5 + (info.engBonus || 0), firstPos: info.firstPos }))
  scored.sort((a, b) => b.score - a.score)
  const top10 = scored.slice(0, 10)
  top10.sort((a, b) => a.firstPos - b.firstPos)

  return top10.map(t => t.word)
}
"""
lines[start:end+1] = [new_func]
with open('index.html','w',encoding='utf-8') as f: f.writelines(lines)
print('OK', file=sys.stderr)
