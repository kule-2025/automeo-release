# Automeo Release

Automeo 全自动经营管理系统 — 桌面客户端安装包发布仓库

## 当前版本

**v0.16.2**（2026-09-19）— 获客管线 + 邮件可投递性 + 私有化运维增强

## 下载

前往 [Releases 页面](https://github.com/kule-2025/automeo-release/releases) 下载最新安装包：

| 文件 | 大小 | 说明 |
|---|---|---|
| Automeo-Setup-0.16.2.exe | 123.25 MB | Windows 安装程序（单文件） |
| Automeo-Setup-0.16.2.exe.blockmap | 0.11 MB | electron-updater 增量更新块映射 |
| latest.yml | — | 自动更新版本检查文件 |

## v0.16.2 更新内容

- **SearchCrawler 关键词闭环**：按关键词白名单调用搜索引擎 API（SerpAPI / Bing / Google CSE），命中的公开网页结构化后进入既有商机闭环（去重入库 → AI 解析 → 五维评分，国内 ≥65 / 海外 ≥70 自动认领）。
- **LeadSource 可插拔适配器**：内置 `csv_file` / `apollo` / `hunter` 三种数据源，新增类型只需登记工厂，无需改动业务服务。
- **退信 Webhook**：`POST /api/v1/email/webhook/bounce` 接收邮件服务商退信事件，统一进入抑制名单。
- **退订抑制闭环**：外发前统一 `isSuppressed()` 拦截；主动退订支持 `POST/GET /api/v1/email/unsubscribe`（含邮件内退订链接直点）。
- **deploy-check 部署自检**：`scripts/deploy-check.js` 一键检查 PostgreSQL / Redis 连通性、.env 关键配置、关键端口与磁盘空间，输出 PASS / WARN / FAIL。
- **export-data 数据导出**：`scripts/export-data.cjs` 将核心业务表导出为本地 JSON + CSV，数据不出本地、可导出。
- **inbound 留资端点**：`POST /api/v1/leads/inbound` 供落地页访客无登录态提交留资。
- **PostgreSQL 连接池治理**：`PRISMA_CONNECTION_LIMIT`（默认 1）限制单实例连接池，配 `pool_timeout=10s`，避免多模块连接数爆炸。

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
