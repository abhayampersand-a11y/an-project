/**
 * Render an on-screen element to a multi-page A4 PDF and trigger a download.
 * Libraries are imported dynamically so they stay out of the main bundle.
 */
export async function downloadElementAsPdf(elementId: string, filename: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ])

  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" })
  const imgData = canvas.toDataURL("image/jpeg", 0.95)

  const pdf = new jsPDF("p", "mm", "a4")
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let heightLeft = imgH
  let position = 0
  pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH)
  heightLeft -= pageH
  while (heightLeft > 0) {
    position -= pageH
    pdf.addPage()
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH)
    heightLeft -= pageH
  }

  pdf.save(filename)
}

/** Make a string safe to use as a file name. */
export function safeFileName(s: string) {
  return s.replace(/[\\/:*?"<>|]+/g, "-")
}
