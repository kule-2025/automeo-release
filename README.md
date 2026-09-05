# Automeo Release

Automeo 全自动经营管理系统 - 发布版安装包

## 版本

- **当前版本**: v0.1.0
- **发布日期**: 2026-09-05

## 下载

| 版本 | 文件 | 大小 |
|------|------|------|
| v0.1.0 | [automeo-v0.1.0.zip](./automeo-v0.1.0.zip) | 0.97 MB |

## 安装说明

### 系统要求

- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- Docker（可选，用于快速启动数据库）

### 快速开始

1. 下载并解压安装包
2. 复制配置文件：
   \\\ash
   cp config/.env.example config/.env
   \\\
3. 编辑 \config/.env\，配置数据库连接和 AI API 密钥
4. 启动数据库（Docker 方式）：
   \\\ash
   cd config
   docker-compose up -d
   \\\
5. 初始化数据库：
   \\\ash
   cd api
   npx prisma generate
   npx prisma db push
   \\\
6. 启动服务：
   \\\ash
   node main.js
   \\\
7. 访问前端：打开 \web/index.html\ 或配置静态文件服务器

## 功能特性

- 商机自动发现与认领（V2EX + 电鸭社区）
- 客户自动开发与多轮智能沟通
- 需求自动解析与 WBS 拆解报价
- AI 自动编码与四维度质量自检
- 自动交付与对账结算
- 数字化员工自动招聘与绩效跟踪
- 自动进化与 A/B 测试优化
- 对话式工作流与意图识别
- 工具调用与 Function Calling（10 种工具）
- 成本监控与预算熔断

## 注意事项

- 本仓库仅包含编译后的安装包，不包含源代码
- 源代码托管于私有仓库
- 首次运行需配置 AI API 密钥（支持 Doubao / OpenAI 兼容接口）
- 支付、搜索等外部服务需自行配置对应密钥

## License

Private
