"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedXmlSummary = exports.getCachedXmlSummary = void 0;
var xmlSummaryCache = new Map();
function getCachedXmlSummary(filePath) {
    return xmlSummaryCache.get(filePath);
}
exports.getCachedXmlSummary = getCachedXmlSummary;
function setCachedXmlSummary(filePath, data) {
    xmlSummaryCache.set(filePath, data);
}
exports.setCachedXmlSummary = setCachedXmlSummary;
//# sourceMappingURL=xml-cache.js.map