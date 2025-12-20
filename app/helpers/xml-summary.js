"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readXmlSummary = void 0;
var fs = require("fs");
var xml2js_1 = require("xml2js");
function readXmlSummary(filePath) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var xml, json, sampleResults, sample, sampleIDs, headers;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    xml = fs.readFileSync(filePath, 'utf16le');
                    return [4 /*yield*/, (0, xml2js_1.parseStringPromise)(xml, {
                            explicitArray: true,
                            trim: true
                        })];
                case 1:
                    json = _e.sent();
                    sampleResults = (json === null || json === void 0 ? void 0 : json.SampleResults) ||
                        (json === null || json === void 0 ? void 0 : json['ns:SampleResults']) ||
                        Object.values(json)[0];
                    sample = ((_a = sampleResults === null || sampleResults === void 0 ? void 0 : sampleResults.SampleResult) === null || _a === void 0 ? void 0 : _a[0]) ||
                        (sampleResults === null || sampleResults === void 0 ? void 0 : sampleResults.SampleResult);
                    if (!sample) {
                        console.error('❌ SampleResult not found');
                        return [2 /*return*/, { headers: [] }];
                    }
                    sampleIDs = ((_c = (_b = sample === null || sample === void 0 ? void 0 : sample.SampleIDs) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.SampleID) ||
                        ((_d = sample === null || sample === void 0 ? void 0 : sample.SampleIDs) === null || _d === void 0 ? void 0 : _d.SampleID) ||
                        [];
                    headers = sampleIDs
                        .map(function (id) {
                        var _a, _b, _c, _d;
                        return ({
                            name: (_b = (_a = id === null || id === void 0 ? void 0 : id.IDName) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.trim(),
                            value: (_d = (_c = id === null || id === void 0 ? void 0 : id.IDValue) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.trim()
                        });
                    })
                        .filter(function (h) {
                        return ['Heat No', 'Stage', 'Grade', 'Part Name'].includes(h.name);
                    });
                    return [2 /*return*/, { headers: headers }];
            }
        });
    });
}
exports.readXmlSummary = readXmlSummary;
//# sourceMappingURL=xml-summary.js.map