"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTerraformJson = generateTerraformJson;
exports.exportTerraform = exportTerraform;
const fs = require("fs");
const path = require("path");
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
function toTfIdentifier(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'resource';
}
function sortKeys(obj) {
    const out = {};
    for (const k of Object.keys(obj).sort())
        out[k] = obj[k];
    return out;
}
function writeJson(file, data) {
    const text = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(file, text);
}
function generateTerraformJson(bp, region = 'us-east-1') {
    // Split into logical files for determinism and readability
    const provider = {
        terraform: {
            required_providers: {
                aws: { source: 'hashicorp/aws', version: '>= 4.0.0' },
            },
        },
        provider: {
            aws: [{ region }],
        },
    };
    const s3 = { resource: { aws_s3_bucket: {} } };
    for (const name of [...(bp.resources?.s3Buckets ?? [])].sort()) {
        const id = toTfIdentifier(name);
        s3.resource.aws_s3_bucket[id] = { bucket: name };
    }
    const dynamo = { resource: { aws_dynamodb_table: {} } };
    for (const t of [...(bp.resources?.dynamoTables ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
        const id = toTfIdentifier(t.name);
        const attrs = [{ name: t.partitionKey || 'id', type: 'S' }];
        const keySchema = [
            { attribute_name: t.partitionKey || 'id', key_type: 'HASH' },
        ];
        if (t.sortKey) {
            attrs.push({ name: t.sortKey, type: 'S' });
            keySchema.push({ attribute_name: t.sortKey, key_type: 'RANGE' });
        }
        dynamo.resource.aws_dynamodb_table[id] = {
            name: t.name,
            billing_mode: 'PAY_PER_REQUEST',
            attribute: attrs.map((a) => ({ name: a.name, type: a.type })),
            hash_key: t.partitionKey || 'id',
            ...(t.sortKey ? { range_key: t.sortKey } : {}),
            key_schema: keySchema.map((k) => ({ attribute_name: k.attribute_name, key_type: k.key_type })),
        };
    }
    const lambda = { resource: { aws_lambda_function: {} } };
    for (const f of [...(bp.resources?.lambdaFunctions ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
        const id = toTfIdentifier(f.name);
        lambda.resource.aws_lambda_function[id] = {
            function_name: f.name,
            handler: f.handler || 'index.handler',
            runtime: f.runtime || 'nodejs20.x',
            // Note: zip file/source code wiring is intentionally omitted (documented in CONFORMANCE)
            filename: 'FUNCTION_ZIP_PLACEHOLDER',
            source_code_hash: 'HASH_PLACEHOLDER',
            role: 'ROLE_ARN_PLACEHOLDER',
        };
    }
    const services = { resource: { null_resource: {} } };
    for (const s of [...(bp.services ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
        const id = toTfIdentifier(`svc_${s.name}`);
        services.resource.null_resource[id] = { triggers: sortKeys({ name: s.name, type: s.type }) };
    }
    return { provider, s3, dynamo, lambda, services };
}
async function exportTerraform(bp, opts) {
    const outRoot = path.resolve(opts.outDir);
    const tfDir = path.join(outRoot, 'terraform');
    ensureDir(tfDir);
    const files = [];
    const { provider, s3, dynamo, lambda, services } = generateTerraformJson(bp, opts.region);
    const mapping = [
        ['providers.tf.json', provider],
        ['s3.tf.json', s3],
        ['dynamo.tf.json', dynamo],
        ['lambda.tf.json', lambda],
        ['services.tf.json', services],
    ];
    for (const [name, json] of mapping) {
        const file = path.join(tfDir, name);
        writeJson(file, json);
        files.push(file);
    }
    return { files };
}
