# Handraw

Handraw 是一个仅面向 Windows 的、以桌面端为优先的手绘风格白板应用。当前仓库围绕 Electron 桌面宿主、React 渲染层、共享基础设施，以及构建与测试脚本组织，后续开发将基于现有结构继续演进。

## 技术栈

- Electron
- React 18
- TypeScript
- Vite
- electron-builder
- pnpm

## 环境要求

- Node.js `>= 20.9`
- pnpm `>= 10`
- Windows

## 安装与开发

```powershell
pnpm install
pnpm dev
```

如果 Electron 二进制因为包管理器策略没有自动下载，可以手动执行：

```powershell
node node_modules\.pnpm\electron@37.2.3\node_modules\electron\install.js
```

## 常用命令

```powershell
pnpm install
pnpm dev
pnpm build
pnpm check
pnpm release:win
```

命令说明：

- `pnpm install` 安装依赖并执行准备脚本
- `pnpm dev` 同时启动 renderer 与 Electron 桌面宿主开发环境
- `pnpm build` 生成 `dist/renderer` 与 `dist/desktop`
- `pnpm check` 运行格式检查、lint、类型检查与测试
- `pnpm release:win` 生成 Windows 安装包与便携版到 `dist/release`

## 仓库结构

```text
.
├─ desktop/                    Electron 桌面宿主源码
│  ├─ main.cjs                应用主进程入口
│  ├─ preload.cjs             预加载脚本
│  ├─ runtime.cjs             运行时辅助逻辑
│  └─ storage.cjs             本地存储相关逻辑
├─ public/                     运行时静态资源
│  ├─ fonts/                  字体资源
│  ├─ icons/                  图标资源
│  └─ runtime-static/         其他静态资源
├─ scripts/                    构建与测试脚本
│  ├─ build/                  构建脚本
│  └─ test/                   测试辅助脚本
├─ src/                        应用源码
│  ├─ app/                    应用层代码
│  ├─ core/                   编辑器核心能力
│  ├─ platform/               平台适配层
│  ├─ shared/                 共享基础设施
│  └─ test/                   集成测试与测试辅助
└─ .github/workflows/          Windows CI 配置
```
