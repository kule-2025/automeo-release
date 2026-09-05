# Automeo - 全自动经营管理系统

> **Auto + Meo**，您的自动化经营伙伴
> 从商机发现到财务结算的全链路自动化经营平台
> 版本：V2.0 ｜ 技术栈：React 18 + NestJS 10 + PostgreSQL 15 + Redis 7 + Prisma 5 + AI网关

---

## 项目简介

Automeo 实现了外包/远程工作经营的全流程自动化：

**商机发现 → AI评估筛选 → 自动触达客户 → 多轮沟通 → 需求解析与报价 → AI自动编码 → 代码质量自检 → 自动打包交付 → 财务结算与成本核算**

V2.0 新增 **智能中心** 四大能力：
- 🤖 **数字化员工**：自动招聘AI Agent，角色定义、能力匹配、绩效跟踪、自动淘汰
- 🧬 **自动进化**：经营结果反馈学习、提示词A/B测试、策略自动调优、成功案例沉淀
- 💬 **对话式工作流**：自然语言操作系统，10种意图识别，自动查询/触发/生成
- 🔧 **工具中心**：Function Calling工具调用，10种工具（数据库/文件/代码/搜索/计算/HTTP/时间/系统），AI Agent可自动调用工具

---

## 技术架构

```
前端层：React 18 + TypeScript + Ant Design 5 + Zustand + React Query + React Router 6 (HashRouter)
网关层：NestJS 10 + JWT认证 + 全局异常过滤 + 操作审计
业务层：17个业务模块 + AI网关（统一模型调用/Token计量/降级重试/Function Calling）
数据层：PostgreSQL 15（39张表）+ Redis 7（缓存/BullMQ队列）
AI层：大模型API（Doubao/OpenAI兼容）+ Mock模式（无Key可运行演示）
部署：Docker Compose
预览：单文件HTML（vite-plugin-singlefile，双击即可打开）
```

---

## 目录结构

```
03-落地实现/
├── apps/
│   ├── api/                          # 后端 NestJS 服务
│   │   └── src/
│   │       ├── main.ts               # 入口
│   │       ├── app.module.ts         # 根模块（17个模块注册）
│   │       ├── common/               # 通用模块（过滤器/拦截器/守卫/装饰器）
│   │       ├── prisma/               # 数据库（schema.prisma 39张表）
│   │       ├── modules/              # 17个业务模块
│   │       │   ├── ai-gateway/       # AI网关（含Function Calling扩展）
│   │       │   ├── auth/             # 认证
│   │       │   ├── user/             # 用户
│   │       │   ├── opportunity/      # 商机发现
│   │       │   ├── customer/         # 客户开发
│   │       │   ├── requirement/      # 需求对接
│   │       │   ├── project/          # 自动开发执行
│   │       │   ├── delivery/         # 交付验收
│   │       │   ├── finance/          # 财务结算
│   │       │   ├── cost/             # 成本资源
│   │       │   ├── monitor/          # 系统监控
│   │       │   ├── analytics/        # 数据分析
│   │       │   ├── agent/            # 🆕 数字化员工管理
│   │       │   ├── evolution/        # 🆕 自动进化机制
│   │       │   ├── conversation/     # 🆕 对话式工作流
│   │       │   └── tool/             # 🆕 工具注册中心
│   │       ├── jobs/                 # 6个定时任务
│   │       └── queues/               # BullMQ队列定义
│   └── web/                          # 前端 React 应用
│       └── src/
│           ├── pages/                # 24个页面（20原有+4新增）
│           ├── layouts/              # 主布局（Automeo品牌导航）
│           ├── components/           # 组件（AutomeoLogo + UI组件）
│           ├── services/             # API调用层（axios封装+Mock拦截）
│           ├── stores/               # Zustand状态管理
│           ├── mocks/                # Mock数据层（全量Mock）
│           └── styles/               # 设计令牌（CSS变量）
├── packages/
│   └── shared/                       # 前后端共享包（枚举/常量/类型）
├── docs/
│   ├── 现有能力清单.md                # 代码审计结果
│   ├── 预设功能实现说明.md            # 4项功能实现详情
│   ├── Automeo设计规范.md             # UI/UX设计规范
│   └── 全功能页面清单与原型说明.md     # 24个页面说明
├── HTML全量功能预览版/                # 🆕 单文件HTML预览版（双击打开）
│   └── index.html
├── docker-compose.yml                 # 容器编排
├── .env.example                       # 环境变量模板
└── package.json                       # monorepo根配置
```

---

## 功能模块

### 核心业务（10个域）

| 模块 | 核心功能 | 页面 | API |
|------|----------|------|-----|
| 用户与账户 | 注册登录、个人中心、实名认证 | P-01, P-02 | 9 |
| 商机发现 | V2EX/电鸭自动抓取、AI评分、商机池 | P-04, P-05 | 8 |
| 客户开发 | 客户画像、自动触达、多轮沟通、意图识别 | P-06, P-07 | 6 |
| 需求对接 | 需求解析、WBS拆解、自动报价、协议生成 | P-08, P-09 | 6 |
| 自动开发 | 任务调度、AI编码Agent、代码质量自检、Kanban | P-10, P-11, P-12 | 7 |
| 交付验收 | 自动打包、上传、验收核对、修改迭代 | P-13 | 5 |
| 财务结算 | 收款、对账、收据、收益核算、提现 | P-14, P-15 | 6 |
| 成本资源 | Token监控、算力管理、预算熔断、盈亏计算 | P-16, P-17 | 6 |
| 系统监控 | 健康度、异常告警、人工兜底、操作审计 | P-18, P-19 | 5 |
| 数据分析 | 经营总览、转化漏斗、收益分析 | P-03, P-20 | 5 |

### 🆕 智能中心（4个新增模块）

| 模块 | 核心功能 | 页面 | API |
|------|----------|------|-----|
| 数字化员工 | Agent角色定义、自动招聘、能力匹配、绩效跟踪、自动淘汰 | P-21 | 14 |
| 自动进化 | 指标采集、提示词版本管理、A/B测试(Z检验)、自动调优、经验库 | P-22 | 18 |
| 对话式工作流 | 自然语言对话、10种意图识别、工作流自动执行、多轮上下文 | P-23 | 6 |
| 工具中心 | 10种工具注册、Function Calling调用循环、参数校验、调用日志 | P-24 | 6 |

### AI网关（核心基础设施）

| 能力 | 说明 |
|------|------|
| 统一调用入口 | 所有业务模块必须通过AIGatewayService调用AI |
| 模型路由 | 按任务类型路由高/中/轻三档模型 |
| Token计量 | 每次调用记录TokenUsage表，计算成本 |
| 降级重试 | 主模型→重试2次→备用模型→兜底 |
| 提示词模板 | 9个Markdown模板+变量替换 |
| 🆕 Function Calling | 工具调用循环（AI决定→执行工具→结果回传→AI继续），最多5轮 |
| Provider | Doubao / OpenAI兼容 / Mock（无Key可运行） |

---

## 快速开始

### 方式一：直接预览（推荐，无需安装）

```bash
# 直接双击打开单文件HTML预览版
HTML全量功能预览版/index.html
```

- 无需Node.js、无需npm install、无需后端服务器
- 所有数据由前端内置Mock提供
- 点击「一键体验演示模式」直接进入系统
- 全部24个页面可浏览交互

### 方式二：本地开发运行

```bash
# 1. 环境要求
# Node.js >= 18, npm >= 9
# PostgreSQL 15（可选，无数据库时用Mock模式）
# Redis 7（可选，队列降级为直接调用）

# 2. 进入项目目录
cd 03-落地实现

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 AI_PROVIDER=mock 即可运行演示

# 5. 生成Prisma Client
cd apps/api
npx prisma generate --schema=src/prisma/schema.prisma

# 6. 启动后端（端口3000）
npm run start:dev

# 7. 启动前端（端口5173）
cd ../web
npm run dev
```

### 方式三：Docker部署

```bash
cd 03-落地实现
docker-compose up -d
```

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | development | 运行环境 |
| `PORT` | 3000 | 后端端口 |
| `DATABASE_URL` | - | PostgreSQL连接串 |
| `REDIS_URL` | - | Redis连接串 |
| `JWT_SECRET` | dev-secret-key | JWT密钥 |
| `JWT_EXPIRES_IN` | 7d | Token过期时间 |
| `AI_PROVIDER` | mock | AI提供商：doubao/openai_compatible/mock |
| `AI_API_KEY` | - | 大模型API Key |
| `AI_BASE_URL` | - | 大模型API地址 |
| `PAYMENT_PROVIDER` | mock | 支付提供商：mock/alipay/wechat |
| `VITE_USE_MOCK` | true | 前端是否启用Mock（预览版默认true） |

---

## 核心业务流程

```
商机抓取(V2EX/电鸭)
    ↓
AI评分匹配(技术40%+预算30%+工期30%)
    ↓ 自动认领(≥70分且盈利)
客户自动触达(AI开场白)
    ↓
多轮沟通(意图识别→等级更新→AI回复)
    ↓ 意向明确
需求解析(AI提取) → WBS拆解 → 自动报价 → 协议生成
    ↓ 确认立项
任务调度(依赖检查+优先级+并发≤3)
    ↓
AI编码Agent(生成代码→写入Workspace→Git提交→自测)
    ↓
代码审查Agent(四维度评分≥80+测试通过率≥90%)
    ↓ 达标
自动打包(README+zip+SHA256) → 上传 → 验收核对(AI逐项核对)
    ↓ 验收通过
财务结算(原子操作:结算单→更新Project→用户余额+利润→交易记录)
    ↓
成本核算(Token+算力+第三方) → 利润计算 → 预算熔断监控
```

---

## 代码规范

- TypeScript严格模式，禁止`any`（必要时用`unknown`）
- 后端严格NestJS模块化架构，每个模块含controller/service/dto/module.ts
- 前端React函数组件 + Hooks，状态管理用Zustand，服务端状态用React Query
- API路径、函数名、文件位置与实施方案一致
- AI调用必须通过AI网关统一入口，禁止业务模块直接调用大模型API
- Token消耗必须每次调用都记录到TokenUsage表
- 所有写操作必须记录操作日志（通过Guard/Interceptor自动完成）
- ESLint + Prettier统一代码风格

---

## 数据库表（39张）

**原有26张**：User, SmsCode, OpportunitySource, Opportunity, Customer, Communication, AIConversation, Requirement, RequirementItem, Project, ProjectTask, CodeSubmission, Delivery, DeliveryFile, FinanceTransaction, Withdraw, CostCategory, CostRecord, TokenUsage, ComputeResource, AlertEvent, SystemLog, QuoteRule, FallbackRule, Settlement, Budget

**新增13张**：AgentRole, DigitalEmployee, AgentPerformance, PromptVersion, Experience, EvolutionMetric, ABTestResult, ChatSession, ChatMessage, WorkflowAction, ToolDefinition, ToolCallLog

---

## 定时任务（6个）

| 任务 | 频率 | 说明 |
|------|------|------|
| 商机抓取 | 每10分钟 | 抓取V2EX/电鸭商机，去重入库，自动评分 |
| 客户回复检查 | 每5分钟 | 检查客户新回复，触发AI自动应答 |
| 验收超时检查 | 每小时 | 超过7天未验收自动验收 |
| 成本汇总 | 每天 | 汇总当日Token/算力/其他成本 |
| 健康度检查 | 每5分钟 | 计算系统健康度评分，触发告警 |
| 数据备份 | 每天 | 数据库备份 |

---

## 文档索引

| 文档 | 说明 |
|------|------|
| `docs/现有能力清单.md` | 代码审计结果，17个模块能力清单 |
| `docs/预设功能实现说明.md` | 4项功能的现状/差距/实现/验证 |
| `docs/Automeo设计规范.md` | Logo/色系/字体/布局/导航/组件规范 |
| `docs/全功能页面清单与原型说明.md` | 24个页面逐一说明 |

---

## License

MIT
