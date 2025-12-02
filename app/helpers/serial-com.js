"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.sendDataSerialPort = exports.readFileAndGetJson = void 0;
var get_file_name_1 = require("./get-file-name");
var serialport_1 = require("serialport");
var xml2js_1 = require("xml2js");
var parseXml = function (xmlContent) {
    return new Promise(function (resolve, reject) {
        (0, xml2js_1.parseString)(xmlContent, { trim: true }, function (err, results) {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                console.log('test');
                var opData = {};
                var sampleResult = results.SampleResults.SampleResult[0];
                var headerResults = sampleResult.SampleIDs[0].SampleID || [];
                var elementsTypes = sampleResult.MeasurementStatistics[0].Measurement[0].Elements[0].Element;
                var elements = elementsTypes.filter(function (elem) { return elem.$.Type === 'Element'; });
                var finalData = elements.map(function (element) {
                    var result = __assign({}, element.$);
                    var concResults = element.ElementResult
                        .filter(function (res) { return res.$.Type === 'Conc'; })
                        .map(function (res) {
                        var limits = !res.ResultValueLimits[0] ? [] : res.ResultValueLimits[0].ResultValueLimit;
                        if (limits.length) {
                            limits = limits.reduce(function (acc, limit) {
                                acc[limit.$.Type] = limit._ ? +limit._ : 0;
                                return acc;
                            }, {});
                        }
                        else {
                            limits = null;
                        }
                        return __assign(__assign({}, res.$), { resultValue: res.ResultValue ? +res.ResultValue[0] : 0, limits: limits });
                    });
                    result['results'] = concResults;
                    result['reportedResult'] = concResults.find(function (res) { return res.StatType === 'Reported'; });
                    return result;
                });
                opData['elements'] = finalData;
                var headerData = headerResults.map(function (result) { return ({
                    name: result.IDName[0],
                    value: result.IDValue[0]
                }); });
                opData['headers'] = headerData;
                resolve(opData);
            }
        });
    });
};
var readFileAndGetJson = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var xmlContent, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, get_file_name_1.readFileAsXml)(filePath)];
            case 1:
                xmlContent = _a.sent();
                return [4 /*yield*/, parseXml(xmlContent)];
            case 2:
                result = _a.sent();
                return [2 /*return*/, result];
        }
    });
}); };
exports.readFileAndGetJson = readFileAndGetJson;
// export const sendDataSerialPort = async (path, data) => {
//     return new Promise((resolve, reject) => {
//         const port = new SerialPort({
//             path,
//             baudRate: 9600
//         });
//         port.on('error', (err) => {
//             // console.log('error occured', err)
//             return reject(err);
//         })
//         port.write(data, (err) => {
//             // console.log('error', err)
//             if (err) {
//                 return reject(err)
//             } else {
//                 resolve('success');
//             }
//             port.close();
//         })
//     })
// }
var sendDataSerialPort = function (path, data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var port = new serialport_1.SerialPort({
                    path: path,
                    baudRate: 9600
                });
                var buffer = '';
                port.on('data', function (chunk) {
                    var str = chunk.toString();
                    console.log("Received from device:", str);
                    buffer += str;
                    if (buffer.includes('$hardwareAck#')) {
                        port.close();
                        return resolve('$hardwareAck#');
                    }
                    if (buffer.includes('$ack#')) {
                        port.close();
                        resolve('$ack#');
                    }
                });
                port.on('error', function (err) { return reject(err); });
                port.write(data, function (err) {
                    if (err)
                        reject(err);
                    else
                        console.log("Data sent to device:", data);
                });
            })];
    });
}); };
exports.sendDataSerialPort = sendDataSerialPort;
//# sourceMappingURL=serial-com.js.map