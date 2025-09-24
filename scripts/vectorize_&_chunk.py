# part2_chunk_and_vectorize.py
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json

# 1. Load raw text
with open("output.txt", "r", encoding="utf-8") as f:
    text = f.read()

# 2. Split into chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = splitter.split_text(text)

# 3. Embed chunks
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(chunks, convert_to_numpy=True)

# 4. Store in FAISS index
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# Save vectors + chunks mapping
with open("chunks.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

emb_list = embeddings.tolist()
with open("vector.json", "w", encoding="utf-8") as f:
    json.dump(emb_list, f)

print("✅ Chunks embedded and stored in FAISS")
