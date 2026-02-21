
import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();
dotenv.config({ path: '.env.local' });

const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
const owner = process.argv[2];
const repo = process.argv[3];

if (!token) {
    console.error('❌ Error: No GITHUB_TOKEN found in .env or .env.local');
    process.exit(1);
}

if (!owner || !repo) {
    console.error('❌ Usage: npx tsx scripts/debug-github-access.ts <owner> <repo>');
    process.exit(1);
}

console.log(`🔍 DIAGNOSING ACCESS TO: https://github.com/${owner}/${repo}`);
console.log(`🔑 Using Token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);

async function runDiagnosis() {
    const octokit = new Octokit({ auth: token });

    try {
        // 1. Check Rate Limit
        console.log('\n--- 1. Checking Rate Limit ---');
        const { data: rateLimit } = await octokit.rest.rateLimit.get();
        console.log(`Remaining: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
        console.log(`Reset: ${new Date(rateLimit.rate.reset * 1000).toLocaleString()}`);

        if (rateLimit.rate.remaining === 0) {
            console.error('❌ RATE LIMIT EXCEEDED. This is likely the cause.');
            return;
        }

        // 2. Check Repo Access & Branch
        console.log('\n--- 2. Checking Repository Access ---');
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        console.log(`✅ Success! Access confirmed.`);
        console.log(`Default Branch: ${repoData.default_branch}`);
        console.log(`Visibility: ${repoData.private ? 'PRIVATE' : 'PUBLIC'}`);
        console.log(`Size: ${repoData.size} KB`);

        // 3. Test Recursive Tree Fetch (The problematic call)
        console.log('\n--- 3. Testing Recursive Tree Fetch (The usual failure point) ---');
        console.log(`Fetching tree for branch: ${repoData.default_branch}...`);

        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: repoData.default_branch,
            recursive: '1',
        });

        console.log(`✅ Recursive fetch SUCCESS.`);
        console.log(`Total items in tree: ${treeData.tree.length}`);

        if (treeData.truncated) {
            console.warn('⚠️ WARNING: Response was TRUNCATED by GitHub. Repo is too large.');
        }

    } catch (error: any) {
        console.error('\n❌ DIAGNOSIS FAILED WITH ERROR:');
        console.error(`Status: ${error.status}`);
        console.error(`Message: ${error.message}`);

        if (error.status === 404) {
            console.error('👉 404 usually means the token does not have access to this repo.');
            console.error('   - Is this a private repo in an Organization? You might need to Enable SSO for the token.');
            console.error('   - Does the token have "repo" scope?');
        } else if (error.status === 409) {
            console.error('👉 409 means the repository is empty or the git database is in an inconsistent state.');
        } else if (error.status === 403) {
            console.error('👉 403 means Forbidden. Check secondary rate limits or organization restrictions.');
        }
    }
}

runDiagnosis();
