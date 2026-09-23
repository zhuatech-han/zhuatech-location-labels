/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
export const MAX_LABELS = 1000;
export const SIZES = {
  "80x40": [80, 40],
  "100x50": [100, 50],
  "60x40": [60, 40],
  "50x30": [50, 30],
};
export const DEFAULTS = Object.freeze({
  mode: "rules",
  prefix: "A",
  racks: 3,
  levels: 4,
  bins: 5,
  start: 1,
  digits: 2,
  pasted: "",
  size: "80x40",
  customWidth: 80,
  customHeight: 40,
  codeType: "code128",
  paper: "single",
  margin: 10,
  gap: 3,
  guides: true,
});

function integer(value, name, min, max) {
  if (
    value === "" ||
    value === null ||
    typeof value === "boolean" ||
    !Number.isInteger(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw new Error(`${name}请填写 ${min}–${max} 之间的整数。`);
  return Number(value);
}

/**
 * 校验并规范化编号、纸张与标签尺寸设置。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function validateSettings(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("配置格式不正确。");
  const s = {};
  for (const key of Object.keys(DEFAULTS)) s[key] = raw[key] ?? DEFAULTS[key];
  if (!["rules", "paste"].includes(s.mode))
    throw new Error("请选择有效的编号输入方式。");
  if (
    typeof s.prefix !== "string" ||
    s.prefix.length > 16 ||
    typeof s.pasted !== "string" ||
    s.pasted.length > 120000
  )
    throw new Error("编号文本过长或格式不正确。");
  if (s.size !== "custom" && !Object.hasOwn(SIZES, s.size))
    throw new Error("请选择支持的标签尺寸。");
  for (const [key, name] of [
    ["customWidth", "宽度"],
    ["customHeight", "高度"],
  ]) {
    if (
      s[key] === "" ||
      typeof s[key] === "boolean" ||
      !Number.isFinite(Number(s[key])) ||
      Number(s[key]) < 10 ||
      Number(s[key]) > 200
    ) {
      if (s.size === "custom")
        throw new Error(`${name}请填写 10–200 mm 之间的数值。`);
      s[key] = DEFAULTS[key];
    }
    s[key] = Number(s[key]);
  }
  if (
    !["code128", "qr"].includes(s.codeType) ||
    !["a4", "single"].includes(s.paper)
  )
    throw new Error("编码类型或纸张不正确。");
  if (typeof s.guides !== "boolean") throw new Error("裁切边框设置不正确。");
  for (const [key, name] of [
    ["racks", "排数"],
    ["levels", "层数"],
    ["bins", "位数"],
    ["start", "起始编号"],
    ["digits", "数字位数"],
  ]) {
    const [min, max] =
      key === "start" ? [0, 999] : key === "digits" ? [2, 3] : [1, 99];
    try {
      s[key] = integer(s[key], name, min, max);
    } catch (error) {
      if (s.mode === "rules") throw error;
      s[key] = DEFAULTS[key];
    }
  }
  for (const [key, min, max, name] of [
    ["margin", 5, 30, "页边距"],
    ["gap", 0, 10, "标签间距"],
  ]) {
    if (
      s[key] === "" ||
      typeof s[key] === "boolean" ||
      !Number.isFinite(Number(s[key])) ||
      Number(s[key]) < min ||
      Number(s[key]) > max
    ) {
      if (s.paper === "a4")
        throw new Error(`${name}请填写 ${min}–${max} mm 之间的数值。`);
      s[key] = DEFAULTS[key];
    }
    s[key] = Number(s[key]);
  }
  return s;
}

/**
 * 按库区、排、层、位规则生成编号，或读取已有编号。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function createCodes(raw) {
  const s = validateSettings(raw);
  if (s.mode === "paste") {
    const codes = s.pasted
      .split(/\r\n|\n|\r/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!codes.length) throw new Error("请每行粘贴一个库位编号。");
    if (codes.length > MAX_LABELS)
      throw new Error(`单次最多生成 ${MAX_LABELS} 张标签，请分批处理。`);
    return codes;
  }
  if (s.racks * s.levels * s.bins > MAX_LABELS)
    throw new Error(
      `当前规则将生成 ${s.racks * s.levels * s.bins} 张，单次上限为 ${MAX_LABELS} 张。请缩小范围。`,
    );
  if (s.start + Math.max(s.racks, s.levels, s.bins) - 1 >= 10 ** s.digits)
    throw new Error(
      "末位编号超过所选数字位数，请调整起始编号或选择 3 位数字。",
    );
  const codes = [];
  const prefix = s.prefix.trim();
  const pad = (n) => String(n).padStart(s.digits, "0");
  for (let r = s.start; r < s.start + s.racks; r++)
    for (let l = s.start; l < s.start + s.levels; l++)
      for (let b = s.start; b < s.start + s.bins; b++)
        codes.push([prefix, pad(r), pad(l), pad(b)].filter(Boolean).join("-"));
  return codes;
}

/**
 * 检查重复编号、不可见字符与条码字符范围。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function codeIssues(codes, type) {
  const errors = [];
  const seen = new Set();
  const duplicates = new Set();
  codes.forEach((code, index) => {
    if (seen.has(code)) duplicates.add(code);
    seen.add(code);
    if ([...code].length > 64)
      errors.push(`第 ${index + 1} 条编号超过 64 个字符，请缩短编号。`);
    else if (/[\p{Cc}\p{Cf}]/u.test(code))
      errors.push(`第 ${index + 1} 条包含不可见字符，请清理后再试。`);
    else if (type === "code128" && !/^[\x20-\x7e]+$/.test(code))
      errors.push(
        `第 ${index + 1} 条包含条形码不支持的字符，请选择二维码，或使用英文、数字和常见符号。`,
      );
  });
  if (duplicates.size)
    errors.unshift(
      `发现 ${duplicates.size} 个重复编号，请核对或点击「移除重复编号」。`,
    );
  return { errors, duplicateCount: duplicates.size };
}

/**
 * 返回预设或自定义标签的毫米尺寸。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function dimensionsFor(raw) {
  const s = validateSettings(raw);
  return s.size === "custom" ? [s.customWidth, s.customHeight] : SIZES[s.size];
}

/**
 * 计算单枚标签或 A4 拼版的实际尺寸与页数。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function layoutFor(raw, count) {
  const s = validateSettings(raw);
  const [width, height] = dimensionsFor(s);
  if (s.paper === "single")
    return {
      width,
      height,
      pageWidth: width,
      pageHeight: height,
      columns: 1,
      rows: 1,
      perPage: 1,
      pages: count,
      left: 0,
      top: 0,
      gap: 0,
    };
  const columns = Math.floor((210 - 2 * s.margin + s.gap) / (width + s.gap));
  const rows = Math.floor((297 - 2 * s.margin + s.gap) / (height + s.gap));
  if (!columns || !rows)
    throw new Error("当前页边距放不下标签，请减小页边距或选择更小的标签。");
  const perPage = columns * rows;
  return {
    width,
    height,
    pageWidth: 210,
    pageHeight: 297,
    columns,
    rows,
    perPage,
    pages: Math.ceil(count / perPage),
    left: s.margin,
    top: s.margin,
    gap: s.gap,
  };
}

/**
 * 返回标签在当前 PDF 页面的毫米坐标。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function labelPosition(layout, index) {
  const local = index % layout.perPage;
  return {
    x: layout.left + (local % layout.columns) * (layout.width + layout.gap),
    y:
      layout.top +
      Math.floor(local / layout.columns) * (layout.height + layout.gap),
  };
}

/**
 * 校验配置文件并恢复有效设置。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON 配置，请选择本工具导出的文件。");
  }
  if (data?.app !== "zhuatech-location-labels" || data?.version !== 1)
    throw new Error("配置来源或版本不匹配，请选择本工具导出的 v1 配置。");
  const settings = validateSettings(data.settings);
  const codes = createCodes(settings);
  const { errors } = codeIssues(codes, settings.codeType);
  if (errors.length) throw new Error(`配置中的编号无效：${errors[0]}`);
  layoutFor(settings, codes.length);
  return settings;
}

/**
 * 生成版本化的编号与设置备份。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function backupFor(settings) {
  return {
    app: "zhuatech-location-labels",
    version: 1,
    settings: validateSettings(settings),
  };
}

/**
 * 将编号安全写入 SVG 文本。
 * 知华科技 · 定制与商业授权：微信 zhuatech / zhuatech2。
 */
export function escapeXml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
}
