import sys
import io
from PyPDF2 import PdfReader

# Byte stream from stdin
# pdf_bytes = sys.stdin.buffer.read()

# # Wrap bytes for PyPdf2
# pdf_stream = io.BytesIO(pdf_bytes)

# # Initialize reader
# reader = PdfReader(pdf_stream)


# def pdf_to_text(pdf_path):
#     reader = PdfReader(pdf_path)
#     text = ""
#     for page in reader.pages:
#         text += page.extract_text() + "\n"
#     return text

pdf_path = "10-handout.pdf"
reader = PdfReader(pdf_path)
# Extract text data from the pdf
text = ""
for page in reader.pages:
    page_text = page.extract_text()
    if page_text:
        text += page_text + "\n"

# Ensure UTF-8 safe output
sys.stdout.reconfigure(encoding='utf-8')

# Write the text to output.txt for testing.
with open("output.txt", "w", encoding="utf-8") as f:
        f.write(text)
print(text)
