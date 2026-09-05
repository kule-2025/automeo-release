"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryModule = void 0;
const common_1 = require("@nestjs/common");
const delivery_controller_1 = require("./controllers/delivery.controller");
const delivery_service_1 = require("./services/delivery.service");
const package_service_1 = require("./services/package.service");
const upload_service_1 = require("./services/upload.service");
const acceptance_service_1 = require("./services/acceptance.service");
const revision_service_1 = require("./services/revision.service");
const workspace_manager_1 = require("../project/workspace/workspace-manager");
const prisma_service_1 = require("../../prisma/prisma.service");
let DeliveryModule = class DeliveryModule {
};
exports.DeliveryModule = DeliveryModule;
exports.DeliveryModule = DeliveryModule = __decorate([
    (0, common_1.Module)({
        controllers: [delivery_controller_1.DeliveryController],
        providers: [
            delivery_service_1.DeliveryService,
            package_service_1.PackageService,
            upload_service_1.UploadService,
            acceptance_service_1.AcceptanceService,
            revision_service_1.RevisionService,
            workspace_manager_1.WorkspaceManager,
            prisma_service_1.PrismaService,
        ],
        exports: [delivery_service_1.DeliveryService, acceptance_service_1.AcceptanceService, revision_service_1.RevisionService],
    })
], DeliveryModule);
//# sourceMappingURL=delivery.module.js.map