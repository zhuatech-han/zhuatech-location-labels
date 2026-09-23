/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权与定制开发：微信 zhuatech / zhuatech2
 */
import {
  DEFAULTS,
  SIZES,
  dimensionsFor,
  createCodes,
  codeIssues,
  layoutFor,
  labelPosition,
  backupFor,
  parseBackup,
} from "./core.js";
import { encodeLabel, labelSvg } from "./encoding.js";

const $ = (id) => document.getElementById(id);
const form = $("settings-form");
const STORAGE_KEY = "zhuatech-location-labels-v2";
const LEGACY_STORAGE_KEY = "zhuatech-location-labels-v1";
let mode = "rules";
let codes = [];
let settings = { ...DEFAULTS };
let layout;
let labels = [];
let labelIndex = 0;
let pageIndex = 0;
let errors = [];
let storageAvailable = true;
let busy = false;
let toastTimer;

function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4000);
}

function readForm() {
  const result = { mode };
  for (const key of Object.keys(DEFAULTS)) {
    if (key === "mode") continue;
    const element = form.elements.namedItem(key);
    result[key] =
      element.type === "checkbox"
        ? element.checked
        : element.type === "number" || key === "digits"
          ? element.value === ""
            ? ""
            : Number(element.value)
          : element.value;
  }
  return result;
}

function applySettings(next) {
  mode = next.mode;
  for (const [key, value] of Object.entries(next)) {
    const element = form.elements.namedItem(key);
    if (!element) continue;
    if (element.type === "checkbox") element.checked = value;
    else element.value = value;
  }
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backupFor(settings)));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  $("storage-note").hidden = storageAvailable;
  $("storage-note").textContent = "设置保存失败，可导出配置。";
}

function update() {
  if (busy) return;
  settings = readForm();
  $("rules-panel").hidden = mode !== "rules";
  $("paste-panel").hidden = mode !== "paste";
  $("mode-rules").setAttribute("aria-pressed", String(mode === "rules"));
  $("mode-paste").setAttribute("aria-pressed", String(mode === "paste"));
  $("a4-options").hidden = settings.paper !== "a4";
  $("guides-option").hidden = settings.paper !== "a4";
  $("custom-size").hidden = settings.size !== "custom";
  $("sheet-section").hidden = settings.paper !== "a4";
  $("download-success").hidden = true;
  errors = [];
  codes = [];
  labels = [];
  layout = undefined;
  let duplicateCount = 0;
  try {
    codes = createCodes(settings);
    ({ errors, duplicateCount } = codeIssues(codes, settings.codeType));
    layout = layoutFor(settings, codes.length);
    if (!errors.length) {
      const [width, height] = dimensionsFor(settings);
      for (const [index, code] of codes.entries()) {
        try {
          labels.push(encodeLabel(code, settings.codeType, width, height));
        } catch (error) {
          errors.push(`第 ${index + 1} 条：${error.message}`);
          break;
        }
      }
    }
    if (!errors.length) saveLocal();
  } catch (error) {
    errors = [error.message || "设置无法生成标签，请检查输入。"];
  }
  $("remove-duplicates").hidden = !duplicateCount;
  $("total-count").textContent = codes.length;
  $("pattern-example").textContent = codes[0] || "—";
  $("download-pdf").disabled = !!errors.length || !codes.length;
  $("export-settings").disabled = !!errors.length;
  $("validation").hidden = !errors.length;
  $("validation").replaceChildren();
  if (errors.length) {
    const list = document.createElement("ul");
    for (const message of errors.slice(0, 4)) {
      const li = document.createElement("li");
      li.textContent = message;
      list.append(li);
    }
    if (errors.length > 4) {
      const li = document.createElement("li");
      li.textContent = `另有 ${errors.length - 4} 条，请核对编号。`;
      list.append(li);
    }
    $("validation").append(list);
  }
  labelIndex = Math.max(0, Math.min(labelIndex, codes.length - 1));
  pageIndex = Math.max(0, Math.min(pageIndex, (layout?.pages || 1) - 1));
  renderPreviews();
}

function renderPreviews() {
  const ready = !errors.length && !!labels.length;
  $("label-focus").replaceChildren();
  $("sheet-preview").replaceChildren();
  if (ready) {
    $("label-focus").innerHTML = labelSvg(labels[labelIndex]);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${layout.pageWidth} ${layout.pageHeight}`);
    svg.setAttribute("aria-label", `第 ${pageIndex + 1} 页排版预览`);
    const start = pageIndex * layout.perPage;
    for (
      let i = start;
      i < Math.min(start + layout.perPage, labels.length);
      i++
    ) {
      const { x, y } = labelPosition(layout, i);
      const group = document.createElementNS(svg.namespaceURI, "g");
      group.setAttribute("transform", `translate(${x} ${y})`);
      const inner = new DOMParser().parseFromString(
        labelSvg(labels[i]),
        "image/svg+xml",
      ).documentElement;
      inner.setAttribute("width", layout.width);
      inner.setAttribute("height", layout.height);
      group.append(inner);
      if (settings.guides && settings.paper === "a4") {
        const border = document.createElementNS(svg.namespaceURI, "rect");
        for (const [key, value] of Object.entries({
          width: layout.width,
          height: layout.height,
          fill: "none",
          stroke: "#bbb",
          "stroke-width": 0.15,
        }))
          border.setAttribute(key, value);
        group.append(border);
      }
      svg.append(group);
    }
    $("sheet-preview").append(svg);
  } else {
    const message = document.createElement("p");
    message.className = "empty-preview";
    message.textContent = "暂无标签";
    $("label-focus").append(message);
    $("sheet-preview").textContent = "等待有效编号";
  }
  $("width-label").textContent =
    `${layout?.width || SIZES[settings.size]?.[0] || "—"} mm`;
  $("sample-position").textContent = ready
    ? `第 ${labelIndex + 1} / ${codes.length} 张`
    : "暂无可导出标签";
  $("previous-label").disabled = !ready || labelIndex <= 0;
  $("next-label").disabled = !ready || labelIndex >= codes.length - 1;
  $("page-count").textContent = ready ? layout.pages : "—";
  $("layout-summary").textContent = ready
    ? settings.paper === "single"
      ? "每页 1 枚标签"
      : `每页 ${layout.perPage} 张 · ${layout.columns} 列 × ${layout.rows} 行`
    : "请先完成编号设置";
  $("paper-summary").textContent = layout
    ? `${settings.paper === "a4" ? "A4" : "单枚"} · ${layout.pageWidth} × ${layout.pageHeight} mm`
    : "—";
  $("sheet-position").textContent = ready
    ? `${pageIndex + 1} / ${layout.pages}`
    : "—";
  $("previous-page").disabled = !ready || pageIndex <= 0;
  $("next-page").disabled = !ready || pageIndex >= layout.pages - 1;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 30000);
}

async function downloadPdf() {
  if (errors.length || !labels.length || busy) return;
  busy = true;
  $("download-pdf").disabled = true;
  const caption = $("download-pdf").querySelector("span");
  caption.textContent = "正在生成 PDF…";
  for (const element of form.elements) element.disabled = true;
  for (const id of [
    "mode-rules",
    "mode-paste",
    "reset-example",
    "import-settings",
  ])
    $(id).disabled = true;
  try {
    const { makePdf } = await import("./pdf.js");
    const blob = await makePdf(labels, layout, settings, (progress) => {
      caption.textContent = `正在生成 ${progress}/${labels.length}…`;
    });
    downloadBlob(
      blob,
      `库位标签_${labels.length}张_${layout.width}x${layout.height}mm.pdf`,
    );
    $("download-success").textContent =
      `已生成 ${labels.length} 张标签，共 ${layout.pages} 页。`;
    $("download-success").hidden = false;
  } catch (error) {
    toast(`生成失败：${error.message || "请稍后重试"}`);
  } finally {
    busy = false;
    $("download-pdf").disabled = false;
    caption.textContent = "下载标签 PDF";
    for (const element of form.elements) element.disabled = false;
    for (const id of [
      "mode-rules",
      "mode-paste",
      "reset-example",
      "import-settings",
    ])
      $(id).disabled = false;
  }
}

form.addEventListener("submit", (event) => event.preventDefault());
let inputTimer;
form.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(update, 140);
});
form.addEventListener("change", () => {
  clearTimeout(inputTimer);
  update();
});
for (const button of document.querySelectorAll("[data-mode]"))
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    labelIndex = 0;
    pageIndex = 0;
    update();
  });
$("reset-example").addEventListener("click", () => {
  applySettings(DEFAULTS);
  labelIndex = 0;
  pageIndex = 0;
  update();
  toast("已载入示例");
});
$("remove-duplicates").addEventListener("click", () => {
  form.elements.pasted.value = [...new Set(codes)].join("\n");
  update();
  toast("已移除重复编号");
});
$("previous-label").addEventListener("click", () => {
  labelIndex--;
  renderPreviews();
});
$("next-label").addEventListener("click", () => {
  labelIndex++;
  renderPreviews();
});
$("previous-page").addEventListener("click", () => {
  pageIndex--;
  renderPreviews();
});
$("next-page").addEventListener("click", () => {
  pageIndex++;
  renderPreviews();
});
$("export-settings").addEventListener("click", () => {
  downloadBlob(
    new Blob([JSON.stringify(backupFor(settings), null, 2)], {
      type: "application/json",
    }),
    "知华库位标签配置.json",
  );
  toast("配置已导出");
});
$("import-settings").addEventListener("click", () => $("config-file").click());
$("config-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 250000)
      throw new Error("配置文件超过 250 KB，请确认文件来源。");
    const next = parseBackup(await file.text());
    const candidateCodes = createCodes(next);
    const [w, h] = dimensionsFor(next);
    candidateCodes.forEach((code) => encodeLabel(code, next.codeType, w, h));
    applySettings(next);
    labelIndex = 0;
    pageIndex = 0;
    update();
    toast("配置已恢复");
  } catch (error) {
    toast(error.message);
  } finally {
    event.target.value = "";
  }
});
$("download-pdf").addEventListener("click", () => {
  clearTimeout(inputTimer);
  update();
  void downloadPdf();
});

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applySettings(parseBackup(saved));
  else {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const previous = parseBackup(legacy);
      const oldSample = { ...DEFAULTS, paper: "a4" };
      const wasSample = Object.keys(oldSample).every(
        (key) => previous[key] === oldSample[key],
      );
      applySettings(wasSample ? DEFAULTS : previous);
    }
  }
} catch {
  storageAvailable = false;
}
update();

const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  const tools = [
    {
      name: "read_location_label_summary",
      description:
        "Read the current label count, paper layout and validation messages. Does not return label contents.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        count: codes.length,
        pages: layout?.pages || 0,
        codeType: settings.codeType,
        paper: settings.paper,
        errors: [...errors],
      }),
    },
    {
      name: "configure_location_labels",
      description:
        "Replace the current workspace with validated pasted location codes and optional barcode type. Updates the visible preview and device-local saved configuration; does not download a file.",
      inputSchema: {
        type: "object",
        properties: {
          codes: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 1000,
          },
          codeType: { type: "string", enum: ["code128", "qr"] },
        },
        required: ["codes"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input) => {
        if (busy) throw new Error("请等待当前 PDF 导出完成。");
        if (
          !input ||
          !Array.isArray(input.codes) ||
          !input.codes.length ||
          input.codes.some(
            (code) => typeof code !== "string" || /[\r\n]/.test(code),
          )
        )
          throw new Error("请提供每项一个编号的数组。");
        const next = parseBackup(
          JSON.stringify(
            backupFor({
              ...settings,
              mode: "paste",
              pasted: input.codes.join("\n"),
              codeType: input.codeType || settings.codeType,
            }),
          ),
        );
        const nextCodes = createCodes(next);
        const [w, h] = dimensionsFor(next);
        nextCodes.forEach((code) => encodeLabel(code, next.codeType, w, h));
        applySettings(next);
        labelIndex = 0;
        pageIndex = 0;
        update();
        return { count: codes.length, pages: layout.pages, ready: true };
      },
    },
  ];
  for (const tool of tools) {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported experimental browser API does not affect the tool. */
    }
  }
  addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
