// Node spawns a child process for the python scripit
import { spawn } from "child_process";
import path from "path";

// Path for python script
const pythonScriptPath = path.join(process.cwd(), "scripts", "pdf_handler.py");
const pythonExecutable = "python";

// Take the pdf file bytes and return a promise
export function pdf_processing(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonExecutable, [pythonScriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });
       // three pipes are stdin, stdout, stderr for warnings

        let stdout = "";
        let stderr = "";
        

        
        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          if (code === 0) {
            resolve(stdout.trim());
          } else {
            reject(new Error(stderr || `Python exited with code ${code}`));
          }
        });

        // send PDF buffer to Python stdin
        proc.stdin.write(buffer);
        proc.stdin.end();
  });
}
