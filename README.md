# Automeo Release

Automeo 全自动经营管理系统 桌面客户端安装包发布仓库

## 当前版本

**v0.16.17**（2026-09-22）

## 下载

前往 [Releases 页面](https://github.com/kule-2025/automeo-release/releases) 下载最新安装包：

| 文件 | 大小 | 说明 |
|---|---|---|
| Automeo-Setup-0.16.17.exe | 124.4 MB | Windows 安装程序（单文件） |
| Automeo-Setup-0.16.17.exe.blockmap | 0.12 MB | electron-updater 增量更新块映射 |
| latest.yml | 小文件 | 自动更新版本检查文件 |

国内镜像请访问 [Gitee Release](https://gitee.com/king2030/automeo-release/releases)。

## v0.16.17 更新内容

- 提示词增强大弹窗移除，改为直接输入框覆盖 + 内联状态条（EnhancedChatInput + ChatAssistantPage 两处同步改造）
- 工具栏10个原创SVG图标（AutomeoIcons.tsx），去除第三方图标依赖
- 更新源切换Gitee国内镜像（updater.ts + electron-builder.yml），错误提示改toast卡片
- 后端端口占用自动降级（EADDRINUSE清理，3000/3001/3002自动探测）

## 安装说明

1. 下载 Automeo-Setup-0.16.17.exe
2. 双击运行安装程序
3. 选择安装目录（默认即可）
4. 点击安装，等待完成
5. 安装完成后自动启动

## 自动更新

应用内置自动更新功能，检测到新版本后会在后台自动下载，重启时自动安装。

## 系统要求

- Windows 10/11 (64位)
- 至少 2GB 可用磁盘空间
- 网络连接（首次启动需初始化数据库）
