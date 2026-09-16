# Changelog

所有版本变更记录

## [v0.14.7] - 2026-09-16

### 新增
- 通知模块 API（notification controller/service/module）
- 客户名称统一工具函数（customer-name.util.ts / customerName.ts）
- 对话AI增强组件：AiModeSwitch、AiSuggestionTags、PromptTemplates
- OpenAPI 统计接口（open-api-stats.controller.ts）

### 修复
- 客户名称显示优先级：公司名称 > 联系人姓名（全局修复）
- 在线IM对话持久化到数据库，支持AI自动回复（人工确认/自动发送双模式）
- 经营总览页面 Network Error：Redis 连接失败时自动降级内存缓存
- 全局 API 路径 404：新增通知模块等 3 个缺失端点
- 导航栏分组折叠优化
- AdminGuard 权限守卫修复
- .env.example 补全缺失配置项
- SmsCode 字段数据库索引优化

### 变更
- 存量测试数据清零，还原生产环境初始状态
- 全量排查：658 个 API / 107 个数据模型 / 99 个页面

## [v0.14.6] - 2026-09-16

- 修复多项部署与运行时问题
- 完善 API 端点覆盖
- 优化前端页面交互

## [v0.14.5] - 2026-09-16

- 客户管理模块优化
- 订单流程修复

## [v0.14.4] - 2026-09-16

- 聊天助手功能增强
- 数据模型调整

## [v0.14.3] - 2026-09-15

- 修复 Prisma schema 问题
- API 稳定性提升

## [v0.14.2] - 2026-09-15

- 修复 Electron 打包问题
- 更新 logo 资源

## [v0.14.1] - 2026-09-15

- 首次正式桌面版发布
- 完整功能模块集成
