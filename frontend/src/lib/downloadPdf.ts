/**
 * Renders `element` to a canvas and slices it across letter-size PDF pages.
 * Runs client-side only (canvas/DOM APIs), so callers must dynamic-import
 * this module rather than importing it at the top of a client component.
 */
export async function downloadPdf(element: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ unit: "in", format: "letter", orientation: "portrait", compress: true });
  const margin = 0.5;
  const usableWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const usableHeight = pdf.internal.pageSize.getHeight() - margin * 2;

  const pxPerIn = canvas.width / usableWidth;
  const pageHeightPx = Math.floor(usableHeight * pxPerIn);

  let renderedPx = 0;
  let pageIndex = 0;

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas context for PDF pagination");
    ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      margin,
      margin,
      usableWidth,
      sliceHeightPx / pxPerIn
    );

    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(filename);
}
