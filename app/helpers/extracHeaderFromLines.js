"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHeaderFromLines = void 0;
function extractHeaderFromLines(lines) {
    var header = {};
    var pickNext = function (label) {
        var _a;
        var idx = lines.findIndex(function (l) { return l === label; });
        if (idx === -1)
            return '';
        return (_a = lines[idx + 1]) !== null && _a !== void 0 ? _a : '';
    };
    header.partName = pickNext('Part name');
    header.drawingNumber = pickNext('Drawing number');
    header.customerName = pickNext('Customer name');
    header.purpose = pickNext('Purpose');
    header.company = pickNext('Company');
    header.department = pickNext('Department');
    header.cmmType = pickNext('CMM Type');
    header.cmmNo = pickNext('CMM No.');
    header.partIdent = pickNext('Part ident');
    header.timeDate = pickNext('Time/Date');
    header.run = pickNext('Run');
    header.measuredValues = pickNext('No. measured values');
    header.redValues = pickNext('No. values: red');
    header.lastMeasurements = lines.find(function (l) { return l.startsWith('Last'); }) || '';
    header.approvalStatus = lines.find(function (l) { return l === 'Approval'; }) ? 'Approval ≠ Blocked' : '';
    return header;
}
exports.extractHeaderFromLines = extractHeaderFromLines;
//# sourceMappingURL=extracHeaderFromLines.js.map