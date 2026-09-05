"use strict";
/**
 * 工具基类 - 所有工具必须继承此类
 * 定义工具的元数据、参数Schema和执行接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
/**
 * 抽象工具基类
 */
class BaseTool {
    constructor(metadata) {
        this.name = metadata.name;
        this.display_name = metadata.display_name;
        this.description = metadata.description;
        this.category = metadata.category;
        this.parameters = metadata.parameters;
        this.return_type = metadata.return_type;
        this.timeout_ms = metadata.timeout_ms ?? 10000;
    }
    /**
     * 获取工具定义（用于AI Function Calling）
     */
    getDefinition() {
        return {
            name: this.name,
            display_name: this.display_name,
            description: this.description,
            category: this.category,
            parameters: this.parameters,
            return_type: this.return_type,
            timeout_ms: this.timeout_ms,
        };
    }
}
exports.BaseTool = BaseTool;
//# sourceMappingURL=base.tool.js.map