/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("dist");
await mkdir(output, { recursive: true });
await cp("src", output, { recursive: true });
const files = [
  [
    "jsbarcode/dist/barcodes/JsBarcode.code128.min.js",
    "JsBarcode.code128.min.js",
  ],
  ["qrcode-generator/dist/qrcode.js", "qrcode.js"],
  ["qrcode-generator/dist/qrcode_UTF8.js", "qrcode_UTF8.js"],
  ["jspdf/dist/jspdf.umd.min.js", "jspdf.umd.min.js"],
];
for (const [source, destination] of files) {
  const target = resolve(output, "vendor", destination);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve("node_modules", source), target);
}
const licenses = [
  ["JsBarcode", "jsbarcode/MIT-LICENSE.txt"],
  ["QR Code Generator", "qrcode-generator/README.md"],
  ["jsPDF", "jspdf/LICENSE"],
];
const notices = await Promise.all(
  licenses.map(
    async ([name, path]) =>
      `${name}\n${await readFile(resolve("node_modules", path), "utf8")}`,
  ),
);
await writeFile(
  resolve(output, "vendor/THIRD_PARTY_NOTICES.txt"),
  notices.join("\n\n"),
);
console.log("Static website built in dist/");
