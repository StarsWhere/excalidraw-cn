# Handraw

Handraw 是一个仅面向 Windows 的 Electron 桌面白板应用。当前仓库不再支持 Web、PWA、在线协作或公开包分发形态，开发与打包都围绕本地桌面使用场景展开。

## 技术栈

- Electron
- React 18
- TypeScript
- Vite
- electron-builder
- pnpm

## 开发要求

- Node.js `>= 18.12`
- pnpm `>= 10`
- Windows

安装依赖：

```powershell
pnpm install
```

启动开发环境：

```powershell
pnpm dev
```

这会同时启动 Vite renderer 和 Electron 主进程。`pnpm start` 是它的别名。

## 常用命令

```powershell
pnpm dev
pnpm build
pnpm dist:win
pnpm lint
pnpm typecheck
pnpm test:app
pnpm test:all
```

说明：

- `pnpm build` 生成 `dist/renderer` 与 `dist/electron`
- `pnpm dist:win` 生成 Windows 安装包与便携版
- `pnpm test:all` 运行格式检查、lint、typecheck 和应用测试

## 目录结构

```text
.
├─ electron/              Electron 源码
├─ public/                图标与静态资源
├─ scripts/               构建脚本
├─ src/                   Renderer 与编辑器源码
├─ dist/renderer/         Vite renderer 构建产物
├─ dist/electron/         Electron 打包输入产物
└─ .github/workflows/     Windows CI
```

## 桌面宿主接口

Renderer 只能通过 preload 暴露的 `window.handrawDesktop` 与宿主交互。当前主要接口包括：

- `openFile`
- `saveFile`
- `readFile`
- `getPendingOpenFile`
- `onOpenFile`
- `openExternal`
- `loadDesktopState`
- `saveDesktopState`
- `loadLibraryState`
- `saveLibraryState`
- `listBoards`
- `writeBoard`
- `deleteBoard`
- `readBinaryFileCache`
- `writeBinaryFileCache`
- `pruneBinaryFileCache`
- `saveSettings`

## 本地数据存储

应用数据保存在 `app.getPath("userData")\\handraw-v2` 下，结构如下：

```text
handraw-v2/
├─ settings.json
├─ library.json
├─ boards.json
├─ boards/
│  └─ <board-id>.excalidraw.json
├─ files/
│  └─ <file-id>.json
```

说明：

- 不再使用 `localStorage` / `IndexedDB`
- 不读取旧 `handraw` 目录，桌面数据从 `handraw-v2` 重新开始
- 图片缓存会在本地文件缓存目录内按引用与时间清理
- 仅保留 `zh-CN` 与 `en` 两套界面语言

## Windows 打包

```powershell
pnpm dist:win
```

默认输出：

- `dist/Handraw Setup <version>.exe`
- `dist/Handraw <version>.exe`
- `dist/win-unpacked/`

已配置文件关联：

- `.excalidraw`
- `.excalidrawlib`

## 验证建议

提交前至少执行：

```powershell
pnpm lint
pnpm typecheck
pnpm test:app --runInBand
pnpm build
pnpm dist:win
```

手工 smoke test 建议覆盖：

- 新建、切换、重命名、删除画布
- 打开与保存 `.excalidraw`
- 导入/导出 PNG、SVG、素材库
- 双击关联文件唤起单实例
- 外链由系统浏览器打开
- `userData` 下生成 `handraw-v2` 的状态文件与图片缓存

## 已移除能力

以下能力不再作为受支持形态：

- Web/PWA
- 在线协作与分享链接
- 远程 scene / library URL 导入
- 公开包入口测试与包分发兼容层
- 多语言动态加载与非中英文语言包

## License

项目沿用仓库中的 [LICENSE](/c:/Users/StarsWhere/code/excalidraw-cn/LICENSE)。
