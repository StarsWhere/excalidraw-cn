# Handraw

Handraw 是一个桌面优先的手绘风格白板应用，基于 Electron、React 18、TypeScript 和 CRA 构建。

当前仓库已经从 Web/PWA 形态迁移为 Electron 桌面应用，首要支持平台为 Windows。项目保留了原有 Excalidraw 风格的绘图体验，并补齐了桌面端常见能力，包括本地文件打开/保存、图片和场景拖拽导入、外链通过系统浏览器打开、Windows 安装包与便携版打包，以及 `.excalidraw` / `.excalidrawlib` 文件关联。

## 项目状态

- 形态：桌面应用，Electron 优先
- 当前主平台：Windows
- 前端技术栈：React 18 + TypeScript + `react-scripts`
- 宿主层：Electron Main / Preload / IPC
- 打包工具：`electron-builder`
- 包管理器：`pnpm`

## 主要特性

- 手绘风格白板绘制
- 本地优先的数据保存方式
- 支持导入 / 导出 `.excalidraw`
- 支持导入 / 导出 `.excalidrawlib`
- 支持导出 PNG / SVG
- 支持将场景嵌入 PNG / SVG
- 支持拖拽导入图片、场景文件和素材库文件
- 支持最近保存文件的再次覆盖保存
- 外部链接通过系统默认浏览器打开
- Windows 安装包和便携版产物

## 环境要求

- Node.js `>= 18.12.0`
- `pnpm` `>= 10`
- Windows 开发环境

推荐先确认版本：

```powershell
node -v
pnpm -v
```

## 快速开始

### 1. 安装依赖

```powershell
pnpm install
```

如果 Electron 二进制因为包管理器策略没有自动下载，可以手动执行：

```powershell
node node_modules\.pnpm\electron@37.2.3\node_modules\electron\install.js
```

### 2. 启动桌面开发环境

```powershell
pnpm start
```

这条命令会同时做两件事：

- 启动 CRA 开发服务器
- 等待 `3000` 端口可用后启动 Electron 窗口

你也可以分别启动：

```powershell
pnpm dev:renderer
pnpm dev:desktop
```

## 常用脚本

### 开发

```powershell
pnpm start
pnpm dev:renderer
pnpm dev:desktop
```

说明：

- `pnpm start`：默认开发入口，启动完整桌面开发环境
- `pnpm dev:renderer`：仅启动 React 开发服务器
- `pnpm dev:desktop`：并行启动 renderer 和 Electron

### 检查

```powershell
pnpm test:typecheck
pnpm test:code
pnpm test:app
pnpm test:all
```

说明：

- `pnpm test:typecheck`：运行 TypeScript 类型检查
- `pnpm test:code`：运行 ESLint
- `pnpm test:app`：运行前端测试
- `pnpm test:all`：执行完整检查链路

### 构建

```powershell
pnpm build
pnpm build:renderer
pnpm build:desktop
```

说明：

- `pnpm build`：当前等价于桌面构建
- `pnpm build:renderer`：构建 React 产物并生成版本信息
- `pnpm build:desktop`：桌面构建入口，当前复用 renderer 构建

### 打包 Windows 安装包

```powershell
pnpm dist:win
```

产物默认输出到 `dist/`：

- `Handraw Setup 0.1.0.exe`
- `Handraw 0.1.0.exe`
- `win-unpacked/`

## 目录结构

```text
.
├─ electron/                 Electron 主进程与 preload
│  ├─ main.cjs
│  ├─ preload.cjs
│  └─ dev-runner.cjs
├─ public/                   静态资源、字体、应用图标
├─ scripts/                  构建辅助脚本
├─ src/
│  ├─ components/            编辑器 UI
│  ├─ data/                  文件、导入导出、序列化
│  ├─ excalidraw-app/        应用级包装层
│  ├─ element/               图元与元素逻辑
│  ├─ scene/                 画布场景逻辑
│  ├─ packages/              内部 package 构建产物与类型
│  └─ index.tsx              React 入口
├─ build/                    CRA 构建产物
├─ dist/                     Electron 打包产物
└─ package.json
```

## Electron 架构说明

### Main Process

文件位置：

- [electron/main.cjs](c:/Users/StarsWhere/code/excalidraw-cn/electron/main.cjs)

职责：

- 创建主窗口
- 处理单实例逻辑
- 接收命令行传入的文件路径
- 使用原生文件对话框打开和保存文件
- 将外部链接交给系统浏览器
- 为渲染进程提供 IPC 能力

### Preload

文件位置：

- [electron/preload.cjs](c:/Users/StarsWhere/code/excalidraw-cn/electron/preload.cjs)

职责：

- 通过 `contextBridge` 暴露安全的宿主 API
- 隔离渲染进程与 Node/Electron 原生能力

渲染层可用的桌面 API：

- `window.handrawDesktop.isElectron`
- `window.handrawDesktop.openFile()`
- `window.handrawDesktop.saveFile()`
- `window.handrawDesktop.readFile()`
- `window.handrawDesktop.getPendingOpenFile()`
- `window.handrawDesktop.onOpenFile()`
- `window.handrawDesktop.openExternal()`

### Renderer

文件位置：

- [src/index.tsx](c:/Users/StarsWhere/code/excalidraw-cn/src/index.tsx)
- [src/components/App.tsx](c:/Users/StarsWhere/code/excalidraw-cn/src/components/App.tsx)
- [src/data/filesystem.ts](c:/Users/StarsWhere/code/excalidraw-cn/src/data/filesystem.ts)

职责：

- 渲染编辑器界面
- 调用 preload 暴露的桌面能力
- 处理画布、导入导出、图形编辑、图像嵌入等业务逻辑

## 文件系统设计

本项目已经移除 `browser-fs-access`，改为 Electron 原生文件能力。

当前文件句柄类型定义为：

```ts
type NativeFileHandle = {
  kind: "native";
  path: string;
  name: string;
};
```

在应用状态中：

- `AppState.fileHandle` 用于记录当前已打开或已保存文件的本地路径
- `Ctrl/Cmd + S` 会尝试直接覆盖当前文件
- `Shift + Ctrl/Cmd + S` 会触发另存为

渲染层文件接口位于：

- [src/data/filesystem.ts](c:/Users/StarsWhere/code/excalidraw-cn/src/data/filesystem.ts)

主要行为：

- `fileOpen()` 返回显式 `{ file, fileHandle }`
- `fileSave()` 通过 Electron 主进程保存到指定路径
- 导入 / 导出链路不再依赖浏览器隐式挂载的 `file.handle`

## 支持的文件类型

### 场景文件

- `.excalidraw`
- `.json`

### 素材库文件

- `.excalidrawlib`

### 图片文件

- `.png`
- `.svg`
- `.jpg`
- `.jpeg`
- `.gif`
- `.webp`
- `.bmp`
- `.ico`

## Windows 文件关联

Electron Builder 已配置以下文件关联：

- `.excalidraw`
- `.excalidrawlib`

配置来源：

- [package.json](c:/Users/StarsWhere/code/excalidraw-cn/package.json)

打包后的 Windows 应用支持：

- 双击场景文件启动应用
- 将文件路径传给已运行实例
- 单实例下由现有窗口接收文件打开事件

## 已移除的 Web/PWA 能力

本仓库当前不再维护以下能力：

- Service Worker
- PWA 安装态
- Web Share Target
- `manifest.json`
- Vercel 部署配置

对应清理内容包括：

- 删除 `src/serviceWorkerRegistration.ts`
- 删除 `src/service-worker.ts`
- 删除 `src/excalidraw-app/pwa.ts`
- 删除 `public/manifest.json`
- 删除 `vercel.json`

## 开发说明

### 为什么仍保留 CRA

当前项目的 renderer 仍使用 `react-scripts`，原因是：

- 现有代码和构建路径已较稳定
- 本次迁移目标是完成 Electron 化，而不是同时做构建器迁移
- 这样可以把风险集中在宿主能力替换和桌面集成上

后续如果需要，可以再独立评估迁移到 Vite 或自定义 Webpack。

### 资源路径处理

由于桌面端生产环境使用 `file://` 加载 `build/index.html`，静态资源路径必须是相对路径。

当前在 [public/index.html](c:/Users/StarsWhere/code/excalidraw-cn/public/index.html) 中固定设置：

```html
<script>
  window.EXCALIDRAW_ASSET_PATH = "./";
</script>
```

这样可以确保字体和导出资源在桌面环境下正常解析。

### 外部链接处理

画布内的外部链接不会再通过浏览器 `window.open()` 打开，而是交给 Electron 主进程调用系统默认浏览器。

相关逻辑：

- [src/components/App.tsx](c:/Users/StarsWhere/code/excalidraw-cn/src/components/App.tsx)
- [electron/main.cjs](c:/Users/StarsWhere/code/excalidraw-cn/electron/main.cjs)

## 发布说明

### 本地打包

```powershell
pnpm dist:win
```

当前打包参数包含：

- `CSC_IDENTITY_AUTO_DISCOVERY=false`
- `signAndEditExecutable=false`

这么配置的原因是：

- 避免本地无签名证书时自动走签名链路
- 降低 Windows 开发机环境权限对打包的影响

如果后续进入正式发布流程，可以再补：

- 代码签名证书
- 安装包图标与品牌素材
- 自动更新策略

## 验证清单

建议在每次关键改动后至少验证以下命令：

```powershell
pnpm test:typecheck
pnpm test:code
pnpm build:renderer
pnpm build:desktop
pnpm dist:win
```

建议手工验证以下桌面行为：

- 新建画布并保存 `.excalidraw`
- 再次打开后编辑并覆盖保存
- 导出 PNG / SVG
- 导入 `.excalidrawlib`
- 拖拽图片文件到画布
- 点击画布中的外链
- 双击 `.excalidraw` 文件唤起应用

## 常见问题

### 1. Electron 启动时报 “failed to install correctly”

原因通常是 Electron 安装脚本没有实际下载二进制。

可执行：

```powershell
node node_modules\.pnpm\electron@37.2.3\node_modules\electron\install.js
```

### 2. `pnpm dist:win` 在本机失败

可能原因：

- 本地权限不足
- 杀毒软件拦截
- Electron Builder 缓存异常

可尝试：

```powershell
Remove-Item "$env:LOCALAPPDATA\\electron-builder\\Cache" -Recurse -Force
pnpm dist:win
```

如果是企业环境，还可能需要管理员权限或开启开发者模式。

### 3. 项目还能不能作为 Web 应用部署

当前不建议。虽然 renderer 仍可单独构建，但仓库目标已经转向桌面专用，不再维护 PWA、manifest 和 Web 分享等能力。

## 后续可选工作

- 增加 macOS / Linux 打包支持
- 引入自动更新
- 自定义应用菜单
- 增加最近打开文件列表
- 将本地持久化从浏览器存储迁移到更明确的桌面数据目录
- 将 renderer 构建从 CRA 迁移到 Vite

## License

本仓库当前保留原项目许可证文件：

- [LICENSE](c:/Users/StarsWhere/code/excalidraw-cn/LICENSE)
