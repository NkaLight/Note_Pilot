"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useEffect, useRef } from "react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ signedUrl }: { signedUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (!container.current) return;           // ← guard against null

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(container.current);
    setWidth(container.current.clientWidth); // initial measurement

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="w-full h-full overflow-y-auto">
      {width > 0 && (                         // ← don't render until measured
        <Document
          file={signedUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={console.error}
        >
          {Array.from({ length: numPages }).map((_, i) => (
            <Page pageNumber={i + 1} width={width} key={i} />
          ))}
        </Document>
      )}
    </div>
  );
}