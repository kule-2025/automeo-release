# Automeo Release

Automeo 全自动经营管理系统 - 桌面客户端安装包发布仓库

## 当前版本

**v0.14.10** (2026-09-17) — 安全审计全量修复版本

## 下载

前往 [Releases 页面](https://github.com/kule-2025/automeo-release/releases) 下载最新安装包：

- `Automeo-Setup-0.14.10.exe` — Windows 安装程序（约 100.7 MB）
- `Automeo-Setup-0.14.10.exe.blockmap` — 增量更新块映射
- `latest.yml` — 自动更新版本检查文件

## v0.14.10 更新内容

**安全审计全量修复版本**，基于v0.14.9安全审计发现的33项风险和53个npm依赖漏洞进行全面修复：

### P0 紧急修复（4项）
1. **Electron硬编码JWT_SECRET兜底移除** — 环境变量缺失时自动生成crypto随机强密钥
2. **tar包11个严重漏洞修复** — 升级至7.5.22，严重漏洞从1降至0
3. **PAY_SECRET弱默认值修复** — 新增强度校验，.env替换为64字符强随机密钥
4. **全局异常过滤器生产环境脱敏** — 不透传原始error.message，响应新增requestId

### P1 高危修复（10项）
CORS收紧、Webhook SSRF防护、AI代码沙箱加固、SQL注入加固、验证码防爆破、文件上传路径遍历防护、敏感字段脱敏、审计日志增强、getLatestCode生产禁用、密码强度校验

### P2 中危修复（6项）
Electron sandbox启用、openExternal协议白名单、数据库备份AES-256加密、前端Token格式校验、Electron CSP注入、Preload安全审计

### 依赖漏洞治理
- npm漏洞：53 → 41（-12），严重漏洞：1 → 0

## 安装说明

1. 从 [Releases](https://github.com/kule-2025/automeo-release/releases) 下载最新 `Automeo-Setup-*.exe`
2. 双击运行安装程序，按提示完成安装
3. 首次启动自动初始化本地数据库
4. 已有用户直接覆盖安装即可，数据自动保留
5. 升级安装时请先退出正在运行的 Automeo

## 功能特性

- 全自动客户开发与多轮智能沟通
- 商机管理与智能报价
- AI 对话助手与在线 IM 集成
- 经营数据总览与可视化看板
- 数字化员工管理与绩效跟踪
- AI自主工具开发与自进化能力

## 注意事项

- 本仓库仅包含编译后的安装包，**不包含源代码**
- 源代码托管于私有仓库，不对外公开
- 支持 Windows 10/11 (64位)

## License

Private