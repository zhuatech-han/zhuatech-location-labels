# 知华库位标签

<img src="src/assets/zhuatech-logo.jpg" width="72" height="72" alt="知华科技" />

**知华科技 · 企业 AI 定制 · 仓储系统开发 · WMS / ERP 对接**

[知华官网](https://www.zhuatech.cn/) · [定制与部署咨询](https://www.zhuatech.cn/contact.html?utm_source=location_labels&utm_medium=source_repo&utm_campaign=warehouse)

免费网页工具：按「库区—排—层—位」生成编号，或粘贴已有编号，预览 Code 128 / QR 标签并导出实际尺寸 PDF。无需账号、模型 API、数据库或服务器端文件处理。网页展示知华仓储定制与系统集成服务，导出标签不附带广告或追踪地址。

使用方法见站内「操作手册」或 [操作手册](docs/操作手册.md)。

## 运行

Node.js 24 LTS（本次使用 24.19.0），npm 11。依赖锁定在 `package-lock.json`。

```sh
npm ci
npm run build
npm run dev
```

打开 `http://127.0.0.1:4178/`。修改 `src/` 后重新构建并刷新。`dist/` 是可部署到静态托管的完整网站，所有运行依赖均随站点提供，不依赖第三方 CDN。

## 验证

```sh
npm run format:check
npm run lint
npm test
npm run build
```

测试覆盖编号边界、重复与非法字符、配置恢复、实际尺寸和分页，以及使用独立 ZXing 解码器检查条形码与二维码内容。测试 PDF 写入忽略的 `test-results/`。

## 使用范围

- 每次最多 1000 张；4 种预设尺寸与自定义宽高（10–200 mm）。默认标签打印机模式：每页一枚，PDF 页面与标签尺寸一致；A4 拼版为备选。
- 通过 PDF 阅读器和厂商驱动打印，驱动的纸张尺寸、方向与实际标签纸保持一致。
- Code 128 支持可打印 ASCII；中文等内容请使用 QR。不可见控制字符与重复编号阻止导出，可明确操作去重。
- 条码与 QR 以矢量矩形写入 PDF。ASCII 编号为文本；非 ASCII 编号使用当前设备字体以 600 DPI 绘制，避免 PDF 中文缺字。不同系统的字形可能不同。
- 自动检查编码密度和文字尺寸。打印时选择「实际大小」或「100%」。
- A4 为手工裁切拼版，预切标签纸需使用对应版式。
- 扫码只得到编号，没有库存查询或出入库后台。
- 设置和编号存储在当前浏览器 `localStorage`，用户可以导出配置；清除浏览器数据会删除本地记录。没有统计追踪、文件上传或远程保存。

## 文件

- `src/core.js`：配置、编号规则、校验、毫米排版。
- `src/encoding.js`：统一的条码几何，用于预览和输出。
- `src/pdf.js`：实际尺寸 PDF 导出。
- `src/app.js`：交互、本地保存和渐进式 WebMCP 支持。
- `src/assets/zhuatech-logo.jpg`：知华官网原版 LOGO，来自本地品牌素材，官网源地址为 `https://www.zhuatech.cn/assets/img/zhihua-logo.jpg`。
- `docs/操作手册.md`：编号、标签尺寸、配置备份和打印操作说明。

## 源码与授权

© 2026 上海如静知华信息科技有限公司，保留所有权利。网页工具免费使用；源码商业授权、二次开发与客户交付请联系知华科技。第三方依赖遵循各自许可证，许可文本随构建复制到 `dist/vendor/THIRD_PARTY_NOTICES.txt`。

## 联系知华科技

上海如静知华信息科技有限公司。企业 AI 定制、仓储系统开发、WMS / ERP 对接、部署及商业授权咨询：

- 官网：[www.zhuatech.cn](https://www.zhuatech.cn/)
- 微信：`zhuatech` / `zhuatech2`

| 微信咨询一                                  | 微信咨询二                                  |
| ------------------------------------------- | ------------------------------------------- |
| ![知华微信咨询一](docs/images/wechat-1.png) | ![知华微信咨询二](docs/images/wechat-2.png) |

联系方式与原始二维码参考用户指定的 [知华 VOC 仓库](https://github.com/zhihua-tech/zhuatech-voc/tree/86a8b09ba328a990274efb9394bd2a85ed1b1230)。
