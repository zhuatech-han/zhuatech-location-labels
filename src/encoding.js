/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import { escapeXml } from "./core.js";

/**
 * 将编号转换成可复用的条码或二维码矢量几何。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function encodeLabel(code, type, width, height, libraries = globalThis) {
  const rects = [];
  const addRect = (x, y, w, h) => rects.push({ x, y, width: w, height: h });
  let fontMm = Math.min(height * 0.16, 6.5);
  const estimatedUnits = [...code].reduce(
    (total, c) => total + (c.charCodeAt(0) > 127 ? 1 : 0.61),
    0,
  );
  fontMm = Math.min(fontMm, (width - 8) / Math.max(estimatedUnits, 1));
  if (fontMm < 2.5)
    throw new Error(
      "编号文字过长，无法在当前尺寸清晰显示。请缩短编号或选大号标签。",
    );
  const text = { value: code, x: width / 2, y: 3 + fontMm, fontMm };
  const codeTop = text.y + 3;
  const codeHeight = height - codeTop - 4;
  if (type === "code128") {
    const encoded = {};
    libraries.JsBarcode(encoded, code, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
    });
    const bits = encoded.encodings.map((x) => x.data).join("");
    const moduleSize = (width - 6) / (bits.length + 20);
    if (moduleSize < 0.25)
      throw new Error("条形码过密：请选择更宽的标签、缩短编号，或改用二维码。");
    const left = 3 + moduleSize * 10;
    for (let i = 0; i < bits.length;) {
      if (bits[i] !== "1") {
        i++;
        continue;
      }
      const start = i;
      while (bits[i] === "1") i++;
      addRect(
        left + start * moduleSize,
        codeTop,
        (i - start) * moduleSize,
        codeHeight,
      );
    }
    return { rects, text, width, height, moduleSize };
  }
  const qr = libraries.qrcode(0, "M");
  if (libraries.qrcode.stringToBytesFuncs?.["UTF-8"])
    libraries.qrcode.stringToBytes =
      libraries.qrcode.stringToBytesFuncs["UTF-8"];
  qr.addData(code, "Byte");
  qr.make();
  const count = qr.getModuleCount();
  const side = Math.min(width - 6, codeHeight);
  const moduleSize = side / (count + 8);
  if (moduleSize < 0.35)
    throw new Error("二维码过密：请缩短编号或选择更大的标签。");
  const left = (width - side) / 2 + moduleSize * 4;
  const top = codeTop + moduleSize * 4;
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count;) {
      if (!qr.isDark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < count && qr.isDark(row, col)) col++;
      addRect(
        left + start * moduleSize,
        top + row * moduleSize,
        (col - start) * moduleSize,
        moduleSize,
      );
    }
  return { rects, text, width, height, moduleSize };
}

/**
 * 根据编码几何生成标签预览。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function labelSvg(label) {
  const { width, height, text, rects } = label;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="库位 ${escapeXml(text.value)} 标签"><rect width="${width}" height="${height}" fill="white"/><text x="${text.x}" y="${text.y}" text-anchor="middle" fill="#111" font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="${text.fontMm}" font-weight="700">${escapeXml(text.value)}</text><g fill="#000">${rects.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"/>`).join("")}</g></svg>`;
}
