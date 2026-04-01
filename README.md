# Handraw

Handraw 是一个仅面向 Windows 的 Electron 白板应用。仓库已经整理为标准的 `main / preload / renderer` 结构，后续开发默认只围绕 Windows 桌面宿主展开，不再兼容其他运行形态。

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
pnpm package:win
```

- `pnpm dev` 同时启动 Vite renderer 与 Electron 主进程
- `pnpm build` 生成 `dist/renderer`、`dist/main`、`dist/preload`
- `pnpm check` 运行格式检查、lint、类型检查与测试
- `pnpm package:win` 生成 Windows 安装包与便携版到 `dist/release`

## 仓库结构

```text
.
├─ public/                      运行时静态资源
│  ├─ fonts/                   字体资源
│  └─ icons/                   图标资源
├─ scripts/                     构建与测试脚本
│  ├─ build/
│  └─ test/
├─ src/
│  ├─ main/                    Electron 主进程
│  ├─ preload/                 Electron 预加载
│  └─ renderer/
│     ├─ app/                  应用装配与宿主边界
│     ├─ editor/               编辑器核心
│     ├─ platform/electron/    Electron bridge
│     ├─ shared/               共享 UI 与工具
│     ├─ workspace/            画布与本地状态业务
│     └─ main.tsx              renderer 入口
├─ test/                        集成测试、夹具与快照
└─ .github/workflows/           Windows CI
```
