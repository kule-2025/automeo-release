"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const ai_gateway_module_1 = require("./modules/ai-gateway/ai-gateway.module");
const auth_module_1 = require("./modules/auth/auth.module");
const user_module_1 = require("./modules/user/user.module");
const opportunity_module_1 = require("./modules/opportunity/opportunity.module");
const customer_module_1 = require("./modules/customer/customer.module");
const requirement_module_1 = require("./modules/requirement/requirement.module");
const project_module_1 = require("./modules/project/project.module");
const delivery_module_1 = require("./modules/delivery/delivery.module");
const finance_module_1 = require("./modules/finance/finance.module");
const cost_module_1 = require("./modules/cost/cost.module");
const monitor_module_1 = require("./modules/monitor/monitor.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const agent_module_1 = require("./modules/agent/agent.module");
const evolution_module_1 = require("./modules/evolution/evolution.module");
const conversation_module_1 = require("./modules/conversation/conversation.module");
const tool_module_1 = require("./modules/tool/tool.module");
const function_calling_module_1 = require("./modules/ai-gateway/function-calling.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const prisma_service_1 = require("./prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || 'dev-secret-key',
                signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
            }),
            ai_gateway_module_1.AIGatewayModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            opportunity_module_1.OpportunityModule,
            customer_module_1.CustomerModule,
            requirement_module_1.RequirementModule,
            project_module_1.ProjectModule,
            delivery_module_1.DeliveryModule,
            finance_module_1.FinanceModule,
            cost_module_1.CostModule,
            monitor_module_1.MonitorModule,
            analytics_module_1.AnalyticsModule,
            agent_module_1.AgentModule,
            evolution_module_1.EvolutionModule,
            conversation_module_1.ConversationModule,
            tool_module_1.ToolModule,
            function_calling_module_1.FunctionCallingModule,
        ],
        providers: [
            prisma_service_1.PrismaService,
            audit_interceptor_1.AuditInterceptor,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map