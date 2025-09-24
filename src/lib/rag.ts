import * as fs from "fs";
import * as path from "path";
import faiss from "faiss-node"; // works locally for testing
import { SentenceTransformer } from "sentence-transformers";

let index: any = null;
let chunks: string[] = [];
let model: any = null;

async function initRag() {
  if (!model) {
    model = new SentenceTransformer("all-MiniLM-L6-v2");
  }
  if (!index) {
    const idxPath = path.resolve("data/vector.index");
    index = faiss.readIndex(idxPath);
    const chunksPath = path.resolve("data/chunks.json");
    chunks = JSON.parse(fs.readFileSync(chunksPath, "utf-8"));
  }
}

export async function retrieveContext(query: string, topK = 3) {
  await initRag();

  const queryVec = await model.encode([query], { convertToTensor: false });
  const [distances, indices] = index.search(queryVec, topK);

  return indices[0].map((i: number) => chunks[i]);
}