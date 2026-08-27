type PdfViewerProps = {
  pdfUrl: string
  title: string
  compact?: boolean
}

export function PdfViewer({ pdfUrl, title, compact = false }: PdfViewerProps) {
  return (
    <div class="pdf-preview">
      <div class="pdf-toolbar">
        <a class="btn btn-secondary btn-sm" href={pdfUrl} download>
          Download PDF
        </a>
        <a class="btn btn-secondary btn-sm" href={pdfUrl} target="_blank" rel="noopener noreferrer">
          Open in new tab ↗
        </a>
      </div>
      <div class="pdf-viewer-wrap">
        <iframe
          class={compact ? 'pdf-viewer pdf-viewer--compact' : 'pdf-viewer'}
          title={title}
          src={pdfUrl}
        />
      </div>
      <p class="pdf-fallback">
        If the preview does not load, use <a href={pdfUrl}>Open in new tab</a> or download the file.
      </p>
    </div>
  )
}
