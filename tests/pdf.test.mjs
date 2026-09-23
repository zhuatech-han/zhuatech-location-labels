/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import JsBarcode from "jsbarcode";
import qrcode from "qrcode-generator";
import { jsPDF } from "jspdf";
import { createCodes, DEFAULTS, layoutFor } from "../src/core.js";
import { encodeLabel } from "../src/encoding.js";
import { makePdf } from "../src/pdf.js";

test("PDF exports all 60 labels in real A4 pages without a trailing blank page", async () => {
  const settings = { ...DEFAULTS, paper: "a4" };
  const codes = createCodes(DEFAULTS);
  const labels = codes.map((code) =>
    encodeLabel(code, "code128", 80, 40, { JsBarcode, qrcode }),
  );
  const pdf = await makePdf(
    labels,
    layoutFor(settings, codes.length),
    settings,
    () => {},
    { jsPDF },
  );
  const buffer = Buffer.from(await pdf.arrayBuffer());
  const text = buffer.toString("latin1");
  assert.equal((text.match(/\/Type \/Page\b/g) || []).length, 5);
  assert.match(text, /\/MediaBox \[0 0 595\.27559 841\.88976\]/);
  assert.ok(!text.includes("zhuatech.cn"));
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/60-labels-a4.pdf", buffer);
});
test("default output makes 60 individual 80 by 40 mm labels", async () => {
  const settings = DEFAULTS;
  const codes = createCodes(settings);
  const labels = codes.map((code) =>
    encodeLabel(code, "code128", 80, 40, { JsBarcode, qrcode }),
  );
  const pdf = await makePdf(
    labels,
    layoutFor(settings, codes.length),
    settings,
    () => {},
    { jsPDF },
  );
  const text = Buffer.from(await pdf.arrayBuffer()).toString("latin1");
  assert.equal((text.match(/\/Type \/Page\b/g) || []).length, 60);
  assert.match(text, /\/MediaBox \[0 0 226\.77165 113\.38583\]/);
});
test("custom media dimensions are preserved in the exported PDF", async () => {
  const settings = {
    ...DEFAULTS,
    size: "custom",
    customWidth: 58,
    customHeight: 40,
  };
  const labels = [encodeLabel("001", "code128", 58, 40, { JsBarcode, qrcode })];
  const pdf = await makePdf(
    labels,
    layoutFor(settings, 1),
    settings,
    () => {},
    { jsPDF },
  );
  const buffer = Buffer.from(await pdf.arrayBuffer());
  assert.match(
    buffer.toString("latin1"),
    /\/MediaBox \[0 0 164\.40945 113\.38583\]/,
  );
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/custom-58x40.pdf", buffer);
});
