/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
function drawUnicodeText(doc, text, offsetX, offsetY, labelWidth) {
  const pxPerMm = 600 / 25.4;
  const widthMm = labelWidth - 8;
  const heightMm = text.fontMm * 1.6;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(widthMm * pxPerMm);
  canvas.height = Math.ceil(heightMm * pxPerMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器无法绘制中文编号。请换用较新的浏览器。");
  let fontMm = text.fontMm;
  const setFont = () => {
    ctx.font = `700 ${fontMm * pxPerMm}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
  };
  setFont();
  const measured = ctx.measureText(text.value).width;
  if (measured > canvas.width) {
    fontMm *= canvas.width / measured;
    setFont();
  }
  if (fontMm < 2.5) throw new Error("中文编号过长，请缩短或使用更大的标签。");
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text.value, canvas.width / 2, text.fontMm * pxPerMm * 1.2);
  doc.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    offsetX + 4,
    offsetY + text.y - text.fontMm * 1.2,
    widthMm,
    heightMm,
  );
}

/**
 * 按实际纸张尺寸导出每一枚标签，保持编号原文。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export async function makePdf(
  labels,
  layout,
  settings,
  onProgress = () => {},
  library = globalThis.jspdf,
) {
  if (!labels.length || labels.length > 1000)
    throw new Error("请生成 1–1000 张有效标签。");
  const orientation =
    layout.pageWidth > layout.pageHeight ? "landscape" : "portrait";
  const doc = new library.jsPDF({
    unit: "mm",
    orientation,
    format: [layout.pageWidth, layout.pageHeight],
    compress: true,
    precision: 5,
    putOnlyUsedFonts: true,
  });
  doc.setProperties({
    title: "Warehouse location labels",
    subject: `${labels.length} location labels`,
    creator: "Local label generator",
  });
  for (let index = 0; index < labels.length; index++) {
    if (index && index % layout.perPage === 0)
      doc.addPage([layout.pageWidth, layout.pageHeight], orientation);
    const local = index % layout.perPage;
    const x =
      layout.left + (local % layout.columns) * (layout.width + layout.gap);
    const y =
      layout.top +
      Math.floor(local / layout.columns) * (layout.height + layout.gap);
    const label = labels[index];
    doc.setFillColor(0, 0, 0);
    for (const rect of label.rects)
      doc.rect(x + rect.x, y + rect.y, rect.width, rect.height, "F");
    if (/^[\x20-\x7e]+$/.test(label.text.value)) {
      doc.setFont("helvetica", "bold");
      let fontMm = label.text.fontMm;
      doc.setFontSize((fontMm * 72) / 25.4);
      const textWidth = doc.getTextWidth(label.text.value);
      if (textWidth > layout.width - 8) {
        fontMm *= (layout.width - 8) / textWidth;
        doc.setFontSize((fontMm * 72) / 25.4);
      }
      if (fontMm < 2.5)
        throw new Error(
          `第 ${index + 1} 条文字过长，请缩短编号或使用大号标签。`,
        );
      doc.setTextColor(0, 0, 0);
      doc.text(label.text.value, x + label.text.x, y + label.text.y, {
        align: "center",
      });
    } else drawUnicodeText(doc, label.text, x, y, layout.width);
    if (settings.guides && settings.paper === "a4") {
      doc.setDrawColor(185, 185, 185);
      doc.setLineWidth(0.12);
      doc.rect(x, y, layout.width, layout.height);
    }
    if ((index + 1) % 20 === 0) {
      onProgress(index + 1);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  onProgress(labels.length);
  return doc.output("blob");
}
