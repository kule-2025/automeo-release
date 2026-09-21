# Automeo Release

Automeo 全自动经营管理系统 — 桌面客户端安装包发布仓库

## 当前版本

**v0.16.9**（2026-09-21）— 落盘核查修复收尾：health 版本号与 UI 版本标记与发布版本对齐

## 下载

前往 [Releases 页面](https://github.com/kule-2025/automeo-release/releases) 下载最新安装包：

| 文件 | 大小 | 说明 |
|---|---|---|
| Automeo-Setup-0.16.9.exe | 126.24 MB | Windows 安装程序（单文件） |
| Automeo-Setup-0.16.9.exe.blockmap | 0.11 MB | electron-updater 增量更新块映射 |
| latest.yml | — | 自动更新版本检查文件 |

安装包 SHA256：`342E5C0D332BBFAE1655F11CC166A7248C11AB81EBD4044A7C90DB8D638F54AB`

## v0.16.9 更新内容

- **健康检查版本号对齐**：`GET /api/v1/health` 返回 `version` 由遗留 `0.16.6` 修正为 `0.16.9`，与安装包版本一致。
- **UI 版本标记对齐**：前端 `CURRENT_UI_VERSION` 由遗留 `0.15.6` 修正为 `0.16.9`，升级后首次启动重置侧边栏折叠状态残留。
- 功能与视觉逻辑零改动，三处 package.json / CHANGELOG / README 版本标识同步 0.16.8 → 0.16.9，回归测试无新增退化。

## 安装说明

1. 从 [Releases](https://github.com/kule-2025/automeo-release/releases) 下载最新 `Automeo-Setup-*.exe`
2. 双击运行安装程序，按提示完成安装
3. 首次启动自动初始化本地数据库
4. 已有用户直接覆盖安装即可，数据自动保留
5. 升级安装时请先退出正在运行的 Automeo

## 自动更新

- 内置 electron-updater，启动时读取 `latest.yml` 检查新版本；
- 增量更新使用 `.blockmap` 仅下载差异块，节省流量。

## 系统要求

- Windows 10 / 11（64 位）

## 注意事项

- 本仓库仅包含编译后的安装包与更新元数据，**不包含源代码**
- 源代码托管于私有仓库，不对外公开

## License

Private
