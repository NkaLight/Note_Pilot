import sys
import io
from PyPDF2 import PdfReader

# Byte stream from stdin
pdf_bytes = sys.stdin.buffer.read()

# Wrap bytes for PyPdf2
pdf_stream = io.BytesIO(pdf_bytes)

# Initialize reader
reader = PdfReader(pdf_stream)

# Extract text data from the pdf
text = ""
for page in reader.pages:
    page_text = page.extract_text()
    if page_text:
        text += page_text + "\n"

# Ensure UTF-8 safe output
sys.stdout.reconfigure(encoding='utf-8')
print(text)
