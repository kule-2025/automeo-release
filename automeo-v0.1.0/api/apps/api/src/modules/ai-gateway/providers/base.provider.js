"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
const common_1 = require("@nestjs/common");
class BaseProvider {
    constructor() {
        this.logger = new common_1.Logger(this.constructor.name);
    }
    estimateTokens(text) {
        // 粗略估算：中文1字≈1.5token，英文1词≈1.3token
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=base.provider.js.map