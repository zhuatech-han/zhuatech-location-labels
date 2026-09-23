/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import test from "node:test";
import assert from "node:assert/strict";
import JsBarcode from "jsbarcode";
import { createRequire } from "node:module";
import { encodeLabel, labelSvg } from "../src/encoding.js";

const require = createRequire(import.meta.url);
const qrcode = require("qrcode-generator");
const {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} = require("@zxing/library");
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
const libraries = { JsBarcode, qrcode };

function decode(label, type) {
  const scale = 12;
  const width = Math.ceil(label.width * scale);
  const height = Math.ceil(label.height * scale);
  const pixels = new Uint8ClampedArray(width * height).fill(255);
  for (const rect of label.rects) {
    const x1 = Math.round(rect.x * scale),
      y1 = Math.round(rect.y * scale);
    const x2 = Math.round((rect.x + rect.width) * scale),
      y2 = Math.round((rect.y + rect.height) * scale);
    for (let y = y1; y < y2; y++)
      pixels.fill(0, y * width + x1, y * width + x2);
  }
  const bitmap = new BinaryBitmap(
    new HybridBinarizer(new RGBLuminanceSource(pixels, width, height)),
  );
  const reader = new MultiFormatReader();
  const hints = new Map([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [type === "qr" ? BarcodeFormat.QR_CODE : BarcodeFormat.CODE_128],
    ],
    [DecodeHintType.TRY_HARDER, true],
    [DecodeHintType.CHARACTER_SET, "UTF-8"],
  ]);
  return reader.decode(bitmap, hints).getText();
}

test("an independent decoder reads the exact Code 128 content from the rendered rectangles", () => {
  for (const code of [
    "A-01-01-01",
    "A-02-02-05",
    "A-03-04-05",
    "000123",
    "WH+01/02",
  ])
    assert.equal(
      decode(encodeLabel(code, "code128", 80, 40, libraries), "code128"),
      code,
    );
});
test("QR round trip preserves Unicode and reserved characters without adding a tracking URL", () => {
  for (const code of ["A-01-01-01", "仓位-001", "A&B<01>"])
    assert.equal(
      decode(encodeLabel(code, "qr", 80, 40, libraries), "qr"),
      code,
    );
});
test("oversized content cannot be disguised by shrinking an unscannable barcode", () => {
  assert.throws(
    () =>
      encodeLabel(
        "WAREHOUSE-LONG-LOCATION-01-02",
        "code128",
        50,
        30,
        libraries,
      ),
    /过密|过长/,
  );
  assert.throws(() => encodeLabel("库位", "code128", 80, 40, libraries));
});
test("preview safely renders special characters as text", () => {
  const svg = labelSvg(encodeLabel("A&B<01>", "qr", 80, 40, libraries));
  assert.ok(svg.includes("A&amp;B&lt;01&gt;"));
  assert.ok(!svg.includes("A&B<01>"));
});
