# ZhiHua Location Labels — Warehouse Barcode and QR Label PDF Tool

[简体中文](README.md) | [English](README.en.md)

<img src="src/assets/zhuatech-logo.jpg" width="72" height="72" alt="ZhiHua Technology" />

Provided by [ZhiHua Technology (Shanghai Rujing Zhihua Information Technology Co., Ltd.)](https://www.zhuatech.cn/), this browser tool generates warehouse location identifiers, Code 128 barcodes and QR codes, then exports PDF labels at their physical dimensions. It supports rule-based numbering and pasted identifiers.

This is a publicly available source learning edition for personal learning, technical research and noncommercial exchange. Commercial use of the company's source requires written authorization. Enterprise information systems, SME digital transformation and AI adoption, private deployments, software outsourcing, implementation, FDE outsourcing, OPC technical support and customization are available through [ZhiHua Technology](https://www.zhuatech.cn/).

## Actual interface

![Rule-based numbering and Code 128 label workspace](docs/images/location-barcode.jpeg)

Generate location identifiers in batches, preview barcode labels and export a PDF with actual label dimensions.

![Pasted Chinese identifiers and QR label workspace](docs/images/location-qr.jpeg)

Paste existing identifiers and preserve Chinese text using QR codes.

## Use cases and implemented features

Use the workspace to prepare warehouse bin labels, replace existing location labels or produce printable batches from an existing identifier list.

| Feature              | Implemented operations                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| Location identifiers | Generate area–row–level–position identifiers or paste one identifier per line   |
| Preview              | Choose Code 128 or QR and inspect labels individually                           |
| PDF export           | Custom label dimensions, one label per page or A4 imposition                    |
| Configuration        | Save settings in the current browser and import/export JSON configuration files |

The user-facing workspace is the only application interface. There is no separate management console, account system or inventory backend. The interface and the [operation manual](docs/操作手册.md) are in Chinese.

## Architecture and directory structure

The application runs in the browser. Numbering validation, barcode geometry and PDF layout are separate modules. Node.js builds the static distribution; Nginx serves it in Docker. Runtime dependencies are bundled locally, without a third-party CDN.

```text
src/
  core.js                 Configuration, numbering, validation and millimetre layout
  encoding.js             Shared barcode geometry for preview and PDF output
  pdf.js                  PDF generation at physical label dimensions
  app.js                  Interaction and device-local persistence
  assets/zhuatech-logo.jpg Official ZhiHua logo
scripts/                  Build, local server and release-material checks
tests/                    Numbering, independent decoding and PDF tests
deploy/nginx.conf         Static container server configuration
docs/操作手册.md           Numbering, sizing, backup and printing manual
docs/images/              Actual workspace screenshots and original Chinese contact images
compose.yaml              Single-service local deployment
```

The application includes optional progressive WebMCP support: where the experimental browser API is available, it registers a summary reader and a validated workspace configuration action. Unsupported browsers continue to use the normal interface; this is not a hosted AI service or an integration guarantee.

## Requirements and startup

Use Node.js 24 LTS and npm 11. Dependency versions are locked in `package-lock.json`. Docker and Docker Compose are required only for container deployment.

```sh
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:4178/`. After editing `src/`, rebuild and refresh. The complete static website is in `dist/`.

## Database initialization and local data

There is no server database, schema migration, administrator initialization or API credential. Identifiers and settings are stored in the current browser's `localStorage`. The initial interface uses preset dimensions and sample numbering, generating 60 labels by default. The sample can also be reloaded explicitly.

Export the JSON configuration before clearing browser data, upgrading or moving to another device. Import it afterwards and verify dimensions and identifiers. Clearing browser data removes local records. The tool has no telemetry, file upload or remote data storage.

## Configuration and deployment

Configuration names are documented in [.env.example](.env.example). `WEB_BIND_ADDRESS` defaults to `127.0.0.1`, and `WEB_PORT` defaults to `4178`; both affect only the container entry point.

```sh
docker compose up --build -d
# Use a separate port if needed:
# WEB_PORT=18178 docker compose up --build -d
```

The container health endpoint is `/health`. Image construction runs lint, business tests and the static build, stopping on failure. Alternatively, publish the contents of `dist/` with a static server and a trusted HTTPS entry point. No external account, model or cloud service is required.

If a port is occupied, select a different `WEB_PORT`. If the page is stale, preserve a configuration backup, rebuild and refresh. For scanning problems, check the character set, label dimensions, printing scale and physical scanner. Production inventory lookup, shared data and permissions require additional implementation.

## Tests and release checks

```sh
npm run format:check
npm run lint
npm test
npm run build
npm run check:release
```

Tests cover numbering boundaries, duplicate and invalid characters, configuration restoration, physical dimensions and pagination. An independent ZXing decoder checks the exact barcode and QR contents. Generated test PDFs are written to the ignored `test-results/` directory.

The release-material check verifies README images, original contact images, licensing and the credential-free example configuration. It does not replace runtime and deployment acceptance checks.

## Printing and known limitations

- A batch is limited to 1,000 labels. Four preset sizes and custom widths/heights of 10–200 mm are supported.
- The default label-printer mode uses one label per PDF page with matching physical dimensions. A4 imposition is an alternative.
- Use a PDF reader and the printer manufacturer's driver. Match the paper size and orientation, and print at actual size or 100%.
- Code 128 accepts printable ASCII. Use QR for Chinese and other Unicode identifiers. Invisible control characters and duplicates block export; duplicates can be removed explicitly.
- Barcode and QR shapes are vector rectangles in the PDF. ASCII identifiers use text; non-ASCII identifiers use the device's font rendered at 600 DPI to avoid missing glyphs. Appearance can vary between systems.
- Encoding density and text size are checked automatically. Physical printing and scanning still need validation on the intended devices.
- A4 imposition is intended for manual cutting. Precut sheets require a matching layout.
- Scanning returns the identifier only. This is not an inventory query, receipt/dispatch system or WMS.
- The two screenshots show actual workspaces. There are no login, permission-management or business-statistics pages.
- The software is provided as is; physical label stock, printer drivers and scanners are not guaranteed compatible.

## Source and licensing

© 2026 Shanghai Rujing Zhihua Information Technology Co., Ltd. All rights reserved. The web tool is free to use, but that does not grant commercial rights to its source code.

The existing [LICENSE](LICENSE) permits personal learning, technical research and noncommercial exchange. Commercial use, enterprise production use, customer delivery, paid deployment, SaaS operation, resale and other commercial source uses require written company authorization. This is source available for noncommercial use, not an OSI-approved open-source license, MIT or Apache licensing.

Third-party dependencies retain their own licenses. Their notices are copied to `dist/vendor/THIRD_PARTY_NOTICES.txt` during the build. Contribution instructions are in [CONTRIBUTING.md](CONTRIBUTING.md). Submit issues with sanitized reproduction details; report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Contact ZhiHua Technology

For commercial licensing or extensive customization, contact ZhiHua Technology (Shanghai Rujing Zhihua Information Technology Co., Ltd.). Services include enterprise AI customization, warehouse software, WMS/ERP integration and deployment consulting.

- Website: [www.zhuatech.cn](https://www.zhuatech.cn/)
- Email: [han@zhuatech.cn](mailto:han@zhuatech.cn)
- Email: [jack@zhuatech.cn](mailto:jack@zhuatech.cn)
- WhatsApp: [+86 17521234993](https://wa.me/8617521234993)
