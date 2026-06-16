"use client";

interface ContourPdfOverlayProps {
  fileUrl: string;
  className?: string;
  title?: string;
}

export default function ContourPdfOverlay({ fileUrl, className = "", title = "Contour overlay" }: ContourPdfOverlayProps) {
  return (
    <object
      data={fileUrl}
      type="application/pdf"
      aria-label={title}
      className={`pointer-events-none absolute inset-0 h-full w-full object-contain opacity-70 mix-blend-multiply ${className}`}
    />
  );
}
