"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotManager = void 0;
const fs = require("fs");
const path = require("path");
class SnapshotManager {
    constructor(opts) {
        this.opts = opts;
        this.root = path.join(opts.dataRoot, 'snapshots');
        fs.mkdirSync(this.root, { recursive: true });
    }
    async create(name, windowMs = 5 * 60 * 1000) {
        const spec = { name, createdAt: new Date().toISOString() };
        // S3
        if (this.opts.s3) {
            const buckets = await this.opts.s3.listBuckets();
            const bSpecs = [];
            for (const b of buckets) {
                const objs = await this.opts.s3.listObjects(b);
                const oSpecs = [];
                for (const o of objs) {
                    const got = await this.opts.s3.getObject(b, o.key);
                    oSpecs.push({ key: o.key, contentType: got.contentType, bodyB64: got.body.toString('base64') });
                }
                bSpecs.push({ name: b, objects: oSpecs });
            }
            spec.s3 = { buckets: bSpecs };
        }
        // Dynamo
        if (this.opts.dynamo) {
            const names = await this.opts.dynamo.listTables();
            const tables = [];
            for (const t of names) {
                const desc = await this.opts.dynamo.describeTable(t);
                const items = await this.opts.dynamo.scanAll(t);
                tables.push({ name: t, schema: { KeySchema: desc.KeySchema, AttributeDefinitions: desc.AttributeDefinitions }, items });
            }
            spec.dynamo = { tables };
        }
        // Lambda
        if (this.opts.lambda) {
            const fns = await this.opts.lambda.listFunctions();
            spec.lambda = { functions: fns };
        }
        // Logs window (last windowMs)
        if (this.opts.logs) {
            const end = Date.now();
            const start = end - windowMs;
            const events = await this.opts.logs.getWindow(start, end);
            spec.logs = { startTime: start, endTime: end, events };
        }
        // Metrics scrape
        if (this.opts.metrics) {
            const scrape = await this.opts.metrics.scrape();
            spec.metrics = { scrape };
        }
        this.writeSpec(spec);
        return spec;
    }
    async replay(name) {
        const spec = this.readSpec(name);
        // Restore S3
        if (spec.s3 && this.opts.s3) {
            for (const b of spec.s3.buckets) {
                await this.opts.s3.createBucket(b.name);
                for (const o of b.objects) {
                    await this.opts.s3.putObject(b.name, o.key, Buffer.from(o.bodyB64, 'base64'), o.contentType);
                }
            }
        }
        // Restore Dynamo
        if (spec.dynamo && this.opts.dynamo) {
            for (const t of spec.dynamo.tables) {
                await this.opts.dynamo.createTable({ TableName: t.name, KeySchema: t.schema.KeySchema, AttributeDefinitions: t.schema.AttributeDefinitions });
                for (const it of t.items)
                    await this.opts.dynamo.putItem(t.name, it);
            }
        }
    }
    specPath(name) { return path.join(this.root, `${safe(name)}.json`); }
    writeSpec(spec) { fs.writeFileSync(this.specPath(spec.name), JSON.stringify(spec, null, 2)); }
    readSpec(name) { return JSON.parse(fs.readFileSync(this.specPath(name), 'utf-8')); }
}
exports.SnapshotManager = SnapshotManager;
function safe(s) { return s.replace(/[^a-zA-Z0-9._-]/g, '_'); }
