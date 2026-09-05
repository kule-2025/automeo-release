"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModule = void 0;
const common_1 = require("@nestjs/common");
const project_controller_1 = require("./controllers/project.controller");
const task_controller_1 = require("./controllers/task.controller");
const project_service_1 = require("./services/project.service");
const task_scheduler_service_1 = require("./services/task-scheduler.service");
const code_agent_service_1 = require("./services/code-agent.service");
const code_review_service_1 = require("./services/code-review.service");
const progress_service_1 = require("./services/progress.service");
const git_service_1 = require("./services/git.service");
const coder_agent_1 = require("./agents/coder.agent");
const reviewer_agent_1 = require("./agents/reviewer.agent");
const tester_agent_1 = require("./agents/tester.agent");
const workspace_manager_1 = require("./workspace/workspace-manager");
const task_execution_queue_1 = require("./queues/task-execution.queue");
const code_review_queue_1 = require("./queues/code-review.queue");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProjectModule = class ProjectModule {
};
exports.ProjectModule = ProjectModule;
exports.ProjectModule = ProjectModule = __decorate([
    (0, common_1.Module)({
        controllers: [project_controller_1.ProjectController, task_controller_1.TaskController],
        providers: [
            project_service_1.ProjectService,
            task_scheduler_service_1.TaskSchedulerService,
            code_agent_service_1.CodeAgentService,
            code_review_service_1.CodeReviewService,
            progress_service_1.ProgressService,
            git_service_1.GitService,
            coder_agent_1.CoderAgent,
            reviewer_agent_1.ReviewerAgent,
            tester_agent_1.TesterAgent,
            workspace_manager_1.WorkspaceManager,
            task_execution_queue_1.TaskExecutionQueue,
            code_review_queue_1.CodeReviewQueue,
            prisma_service_1.PrismaService,
        ],
        exports: [project_service_1.ProjectService, progress_service_1.ProgressService, code_agent_service_1.CodeAgentService, code_review_service_1.CodeReviewService],
    })
], ProjectModule);
//# sourceMappingURL=project.module.js.map