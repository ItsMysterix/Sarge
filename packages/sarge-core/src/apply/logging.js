"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLog = formatLog;
function formatLog(service, stream, data) {
    const msg = typeof data === 'string' ? data : data.toString('utf8');
    return JSON.stringify({ ts: Date.now(), service, stream, msg }) + '\n';
}
