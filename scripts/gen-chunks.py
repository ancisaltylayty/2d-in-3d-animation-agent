import json

with open("Suara original/Saham & crypto.json", "r", encoding="utf-8") as f:
    data = json.load(f)

raw_words = data[0]["words"]
clean_words = []
for w in raw_words:
    if w.get("type") == "word":
        clean_words.append({
            "text": w["text"].strip(),
            "start": round(w["start"], 2),
            "end": round(w["end"], 2)
        })

print(f"Total clean words: {len(clean_words)}")

chunks = []
i = 0
while i < len(clean_words):
    w1 = clean_words[i]
    if i + 1 < len(clean_words):
        w2 = clean_words[i+1]
        gap = w2["start"] - w1["end"]
        combined_len = len(w1["text"]) + len(w2["text"])
        has_terminal_punct = any(w1["text"].endswith(p) for p in [".", "?", "!", ":", ";", ","])
        if not has_terminal_punct and gap < 0.35 and combined_len <= 16:
            chunks.append({
                "text": f"{w1['text']} {w2['text']}",
                "start": w1["start"],
                "end": w2["end"]
            })
            i += 2
            continue
    chunks.append({
        "text": w1["text"],
        "start": w1["start"],
        "end": w1["end"]
    })
    i += 1

with open("src/videos/saham/caption_chunks.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, indent=2, ensure_ascii=False)

print(f"Saved {len(chunks)} chunks to src/videos/saham/caption_chunks.json")
for w in clean_words:
    print(f"{w['start']:6.2f}s (f={int(round(w['start']*30)):4d}..{int(round(w['end']*30)):4d}): {w['text']}")
