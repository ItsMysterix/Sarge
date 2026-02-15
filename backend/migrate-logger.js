const fs = require('fs');
const path = require('path');
const base = '/Users/mysterix/Downloads/Sarge-1/backend/src';

const migrations = [
    {
        file: 'services/github-scanner.ts',
        importLine: "import { scannerLogger } from '../lib/logger';",
        replace: [['console.log', 'scannerLogger.info']]
    },
    {
        file: 'api/lib/credentials.ts',
        importLine: "import { credLogger } from '../lib/logger';",
        replace: [['console.log', 'credLogger.info']]
    },
    {
        file: 'api/lib/ai-analyzer.ts',
        importLine: "import { aiLogger } from '../lib/logger';",
        replace: [['console.log', 'aiLogger.info']]
    },
    {
        file: 'api/routers/databases.ts',
        importLine: "import logger from '../../lib/logger';\nconst dbOpsLogger = logger.child({ module: 'db-ops' });",
        replace: [['console.log', 'dbOpsLogger.info']]
    },
    {
        file: 'services/deployment-orchestrator.ts',
        importLine: "import { deployLogger } from '../lib/logger';",
        replace: [['console.log', 'deployLogger.info'], ['console.error', 'deployLogger.error']]
    },
    {
        file: 'api/lib/providers/local.ts',
        importLine: "import { providerLogger } from '../../lib/logger';",
        replace: [['console.log', 'providerLogger.info']]
    },
    {
        file: 'api/lib/providers/aws.ts',
        importLine: "import { providerLogger } from '../../lib/logger';",
        replace: [['console.log', 'providerLogger.info']]
    },
    {
        file: 'api/lib/providers/gcp.ts',
        importLine: "import { providerLogger } from '../../lib/logger';",
        replace: [['console.log', 'providerLogger.info']]
    },
    {
        file: 'api/lib/providers/azure.ts',
        importLine: "import { providerLogger } from '../../lib/logger';",
        replace: [['console.log', 'providerLogger.info']]
    },
    {
        file: 'api/trpc/middlewares/audit.ts',
        importLine: "import logger from '../../lib/logger';",
        replace: [['console.log', 'logger.info']]
    },
    {
        file: 'api/routers/alerts.ts',
        importLine: "import logger from '../../lib/logger';",
        replace: [['console.log', 'logger.info']]
    },
    {
        file: 'api/routers/oneclick.ts',
        importLine: "import logger from '../../lib/logger';\nconst oneclickLogger = logger.child({ module: 'oneclick' });",
        replace: [['console.log', 'oneclickLogger.info']]
    },
    {
        file: 'api/lib/db.ts',
        importLine: "import { dbLogger } from '../lib/logger';",
        replace: [['console.warn', 'dbLogger.warn'], ['console.error', 'dbLogger.error']]
    },
    {
        file: 'api/lib/schema.ts',
        importLine: "import { dbLogger } from '../lib/logger';",
        replace: [['console.warn', 'dbLogger.warn'], ['console.error', 'dbLogger.error']]
    }
];

let totalReplaced = 0;
for (const m of migrations) {
    const fp = path.join(base, m.file);
    if (!fs.existsSync(fp)) {
        console.log('SKIP (not found):', m.file);
        continue;
    }
    let content = fs.readFileSync(fp, 'utf8');

    // Remove any previously sed-inserted pino import lines at top
    const lines = content.split('\n');
    const cleanedLines = [];
    let removedSed = false;
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (i < 5 && (
            l.startsWith("import { scannerLogger }") ||
            l.startsWith("import { credLogger }") ||
            l.startsWith("import { aiLogger }") ||
            l.startsWith("import logger from '../../lib/logger';") ||
            l.startsWith("import logger from '../lib/logger';") ||
            l.startsWith("const dbOpsLogger") ||
            l.startsWith("import { providerLogger }") ||
            l.startsWith("import { deployLogger }") ||
            l.startsWith("import { dbLogger }")
        )) {
            removedSed = true;
            continue; // skip this sed-inserted line
        }
        cleanedLines.push(l);
    }
    content = cleanedLines.join('\n');

    // Insert import after first import line
    const firstImportEnd = content.indexOf('\n');
    if (firstImportEnd === -1) {
        console.log('SKIP (no newline):', m.file);
        continue;
    }
    content = content.slice(0, firstImportEnd) + '\n' + m.importLine + content.slice(firstImportEnd);

    // Do replacements
    let count = 0;
    for (const [from, to] of m.replace) {
        const regex = new RegExp(from.replace(/\./g, '\\.'), 'g');
        const matches = content.match(regex);
        if (matches) count += matches.length;
        content = content.replace(regex, to);
    }
    totalReplaced += count;

    fs.writeFileSync(fp, content);
    console.log(`Migrated: ${m.file} (${count} replacements)`);
}
console.log(`\nTotal console.log replacements: ${totalReplaced}`);
