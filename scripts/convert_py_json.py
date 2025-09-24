# convert_npy_to_json.py
import numpy as np
import json
import faiss

# Load FAISS index
index = faiss.read_index("./vector.index")

# Extract vectors from FAISS
vectors = index.reconstruct_n(0, index.ntotal)  # shape: (ntotal, dim)

# Convert to list and save as JSON
vectors_list = vectors.tolist()
with open("vectors.json", "w", encoding="utf-8") as f:
    json.dump(vectors_list, f)

print("✅ Converted chunks.npy → chunks.json")
