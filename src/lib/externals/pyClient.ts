const PY_BASE_URL = process.env.NODE_ENV === "production" 
    ? "https://ndlnk218-vector-embeddings.hf.space" 
    : "http://localhost:8000";

class PythonServiceClient {
  private baseUrl: string;
  private secret: string;
  private huggingFaceKey: string;

  constructor() {
    this.baseUrl = PY_BASE_URL;
    this.secret = process.env.INTERNAL_SHARED_SECRETE!;
    this.huggingFaceKey = process.env.HF_TOKEN_EXT_API_ACCESS;
  }

  async ingest(uploadId: string) {
    const res = await fetch(`${this.baseUrl}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": String(this.secret),
        "Authorization":`Bearer  ${this.huggingFaceKey}`
      },
      body: JSON.stringify({ uploadId }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Python Ingest Failed: ${error}`);
    }

    return res.json();
  }
  async generateVector(prompt:string){
    const res = await fetch(`${this.baseUrl}/generatevector`, {
      method: "POST",
      headers:{
        "Content-Type":"application/json", 
        "x-internal-secret": String(this.secret), 
        "Authorization":`Bearer  ${this.huggingFaceKey}`
      },
      body:JSON.stringify({prompt})
    });
    if(!res.ok){
      const error = await res.text();
      throw new Error(`Error generating vector embeddings ${error}`);
    }
    return res.json();
  }
}

// Singleton logic for Next.js Hot Reloading
const globalForPy = global as unknown as { pyClient: PythonServiceClient };

export const pyClient = globalForPy.pyClient || new PythonServiceClient();

if (process.env.NODE_ENV !== "production") globalForPy.pyClient = pyClient;

// headers: {
//   "Content-Type": "application/json",
//   "x-internal-secret": String(this.secret),
//   // Only add this line if your space visibility is set to "Private"
//   "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}`, 
// },