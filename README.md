# Automeo Release

Automeo 全自动经营管理系统 — 桌面客户端安装包发布仓库

## 当前版本

**v0.16.3**（2026-09-20）— 例行版本迭代与双源发布

## 下载

前往 [Releases 页面](https://github.com/kule-2025/automeo-release/releases) 下载最新安装包：

| 文件 | 大小 | 说明 |
|---|---|---|
| Automeo-Setup-0.16.3.exe | 123.25 MB | Windows 安装程序（单文件） |
| Automeo-Setup-0.16.3.exe.blockmap | 0.11 MB | electron-updater 增量更新块映射 |
| latest.yml | — | 自动更新版本检查文件 |

## v0.16.3 更新内容

- 例行版本迭代，同步 README 版本标识，重建安装包并完成 GitHub / Gitee 双源发布。
- 无功能性代码变更，回归测试全部通过（21/21 套件）。

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