const { execSync } = require("child_process");

try {
  console.log("Note you may need to Ctrl-Shift-P in VS Code to change the interpreter. Check pythonExecutable is correct in /summarize/route.ts. (could be Python3")
  console.log("Checking Python version...");
  const pyVersion = execSync("python3 --version || python --version", { stdio: 'pipe' }).toString().trim();
  console.log("Python version:", pyVersion);

  console.log("Installing PyPDF2...");
  execSync("python3 -m pip install --upgrade pip || python -m pip install --upgrade pip", { stdio: "inherit" });
  execSync("python3 -m pip install PyPDF2 || python -m pip install PyPDF2", { stdio: "inherit" });

  console.log("PyPDF2 installed successfully!");
} catch (err) {
  console.error("Error during Python setup:", err.message);
}