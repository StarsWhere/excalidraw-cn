# Handraw

Handraw 是一个仅面向 Windows 的 desktop-first 白板应用。仓库已经按桌面宿主、renderer、共享基础设施、文档和构建脚本重新整理，后续开发只围绕当前结构演进。

## Stack

- Electron
- React 18
- TypeScript
- Vite
- electron-builder
- pnpm

## Requirements

- Node.js `>= 18.12`
- pnpm `>= 10`
- Windows

## Commands

```powershell
pnpm install
pnpm dev
pnpm build
pnpm check
pnpm release:win
```

命令说明：

- `pnpm dev` 启动 renderer 与桌面宿主开发环境
- `pnpm build` 生成 `dist/renderer` 与 `dist/desktop`
- `pnpm check` 运行格式、lint、typecheck 与测试
- `pnpm release:win` 生成 Windows 安装包与便携版到 `dist/release`

## Repository Layout

```text
.
├─ desktop/                    桌面宿主源码
├─ docs/
│  ├─ architecture/           架构说明
│  ├─ development/            开发与测试说明
│  ├─ release/                打包与发布说明
│  └─ assets/                 文档资源
├─ public/
│  ├─ fonts/                  运行时字体资源
│  ├─ icons/                  运行时图标资源
│  └─ runtime-static/         其他运行时静态资源
├─ scripts/
│  ├─ build/                  构建脚本
│  ├─ test/                   测试辅助脚本
│  └─ utils/                  工具脚本
├─ src/
│  ├─ app/desktop/            Handraw 桌面壳层
│  ├─ core/editor/            编辑器核心
│  ├─ platform/desktop/       Electron API 适配层
│  ├─ shared/                 共享基础设施
│  └─ test/                   集成测试与测试辅助
└─ .github/workflows/         Windows CI
```
