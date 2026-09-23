/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS,
  createCodes,
  codeIssues,
  layoutFor,
  labelPosition,
  parseBackup,
  backupFor,
} from "../src/core.js";

test("warehouse sample produces every location once, preserving zero padding", () => {
  const codes = createCodes(DEFAULTS);
  assert.equal(codes.length, 60);
  assert.equal(new Set(codes).size, 60);
  assert.equal(codes[0], "A-01-01-01");
  assert.equal(codes[29], "A-02-02-05");
  assert.equal(codes.at(-1), "A-03-04-05");
  assert.deepEqual(
    createCodes({
      ...DEFAULTS,
      prefix: "",
      racks: 1,
      levels: 1,
      bins: 2,
      start: 0,
      digits: 3,
    }),
    ["000-000-000", "000-000-001"],
  );
});
test("reject invalid, oversized and overflowing ranges before allocating labels", () => {
  for (const racks of ["", -1, 0, 1.5, Infinity, "wrong", true])
    assert.throws(() => createCodes({ ...DEFAULTS, racks }));
  assert.throws(
    () => createCodes({ ...DEFAULTS, racks: 99, levels: 99, bins: 99 }),
    /上限/,
  );
  assert.throws(
    () => createCodes({ ...DEFAULTS, start: 99, bins: 5, digits: 2 }),
    /数字位数/,
  );
});
test("paste preserves literal zeros and reports duplicates rather than silently deleting them", () => {
  const codes = createCodes({
    ...DEFAULTS,
    mode: "paste",
    pasted: " 001 \r\n\n002\r003\n001\n",
  });
  assert.deepEqual(codes, ["001", "002", "003", "001"]);
  assert.equal(codeIssues(codes, "code128").duplicateCount, 1);
  assert.equal(codeIssues(["仓位01"], "code128").errors.length, 1);
  assert.deepEqual(codeIssues(["仓位01"], "qr").errors, []);
  assert.equal(codeIssues(["A\u200b01"], "qr").errors.length, 1);
});
test("hidden unfinished inputs do not block pasted codes or single-label output", () => {
  const settings = {
    ...DEFAULTS,
    mode: "paste",
    pasted: "001\n002",
    racks: "",
    start: "",
    paper: "single",
    margin: "",
    gap: "",
  };
  assert.deepEqual(createCodes(settings), ["001", "002"]);
  assert.equal(layoutFor(settings, 2).pages, 2);
  assert.deepEqual(
    createCodes(parseBackup(JSON.stringify(backupFor(settings)))),
    ["001", "002"],
  );
  assert.throws(() => createCodes({ ...settings, mode: "rules" }), /排数/);
  assert.throws(() => layoutFor({ ...settings, paper: "a4" }, 2), /页边距/);
});
test("A4 uses real millimetres, includes no blank tail page, and stays within margins", () => {
  for (const count of [1, 12, 13, 60, 1000]) {
    const layout = layoutFor({ ...DEFAULTS, paper: "a4" }, count);
    assert.equal(layout.perPage, 12);
    assert.equal(layout.pages, Math.ceil(count / 12));
    for (let i = 0; i < count; i++) {
      const { x, y } = labelPosition(layout, i);
      assert.ok(x >= 10 && y >= 10);
      assert.ok(x + 80 <= 200.0001 && y + 40 <= 287.0001);
    }
  }
  const single = layoutFor(DEFAULTS, 60);
  assert.deepEqual(
    [single.pageWidth, single.pageHeight, single.pages],
    [80, 40, 60],
  );
});
test("custom media sizes survive backup and reject unsupported dimensions", () => {
  const settings = {
    ...DEFAULTS,
    size: "custom",
    customWidth: 58,
    customHeight: 40,
  };
  const restored = parseBackup(JSON.stringify(backupFor(settings)));
  const layout = layoutFor(restored, 60);
  assert.deepEqual(
    [layout.pageWidth, layout.pageHeight, layout.perPage, layout.pages],
    [58, 40, 1, 60],
  );
  for (const width of ["", true, 0, 201, Infinity])
    assert.throws(
      () => layoutFor({ ...settings, customWidth: width }, 1),
      /宽度/,
    );
  assert.throws(
    () => layoutFor({ ...settings, paper: "a4", customWidth: 200 }, 1),
    /放不下/,
  );
});
test("backup validates the full document, avoids prototype keys and rejects bad versions", () => {
  assert.deepEqual(parseBackup(JSON.stringify(backupFor(DEFAULTS))), DEFAULTS);
  assert.throws(() => parseBackup("{bad"));
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ app: "unrelated", version: 1, settings: DEFAULTS }),
    ),
  );
  assert.throws(() =>
    parseBackup(JSON.stringify({ ...backupFor(DEFAULTS), version: 2 })),
  );
  assert.throws(
    () =>
      parseBackup(
        JSON.stringify({
          app: "zhuatech-location-labels",
          version: 1,
          settings: { ...DEFAULTS, mode: "paste", pasted: "A\nA" },
        }),
      ),
    /重复/,
  );
  assert.throws(() =>
    parseBackup(JSON.stringify(backupFor({ ...DEFAULTS, size: "__proto__" }))),
  );
});
