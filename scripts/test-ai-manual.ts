
import { AIRepositoryAnalyzer } from '../backend/src/api/lib/ai-analyzer';

// Mock class to override protected methods
class TestableAnalyzer extends AIRepositoryAnalyzer {
    protected octokitMock: any;

    constructor(mock: any) {
        process.env.ANTHROPIC_API_KEY = 'dummy-key-for-testing';
        super();
        this.octokitMock = mock;
    }

    // Override the protected factory method to inject our mock
    protected createOctokit(token: string): any {
        console.log('Creating mock Octokit client');
        return this.octokitMock;
    }

    // Public wrapper to access private method for testing
    public async testScan(owner: string, repo: string, branch: string, token: string) {
        // @ts-ignore - accessing private method
        return (this as any).scanRepositoryViaAPI(owner, repo, branch, token);
    }
}

async function runTest() {
    console.log('--- STARTING MANUAL TEST: AI SCAN LOGIC ---');

    // 1. Setup Mock for FALLBACK SCENARIO
    // We simulate a failure in getTree(recursive=1) to force the code to use the root fallback
    const mockOctokitFallback = {
        rest: {
            repos: {
                get: async () => {
                    console.log('Mock: repos.get called (default branch check)');
                    return { data: { default_branch: 'main' } };
                },
                getContent: async (args: any) => {
                    console.log(`Mock: repos.getContent called for path: '${args.path}'`);
                    if (args.path === '') {
                        // Return root directory listing
                        return {
                            data: [
                                { path: 'package.json', type: 'file', size: 100, sha: 'abc' },
                                { path: 'README.md', type: 'file', size: 500, sha: 'def' },
                                { path: 'src', type: 'dir', sha: 'ghi' },
                                { path: 'ignored.txt', type: 'file', size: 10, sha: 'jkl' }
                            ]
                        };
                    }
                    // Return file content
                    return { data: 'mock-file-content' };
                }
            },
            git: {
                getTree: async (args: any) => {
                    console.log(`Mock: git.getTree called (recursive=${args.recursive})`);
                    if (args.recursive === '1') {
                        throw new Error('API Error: Git tree too large (Simulated)');
                    }
                    return { data: { tree: [] } };
                }
            }
        }
    };

    const analyzer = new TestableAnalyzer(mockOctokitFallback);

    try {
        console.log('Running scan...');
        const files = await analyzer.testScan('owner', 'repo', 'main', 'token');

        console.log(`Scan completed. Found ${files.length} files.`);
        files.forEach((f: { path: any; size: any; }) => console.log(` - ${f.path} (${f.size} bytes)`));

        // Assertions
        const hasPackageJson = files.some((f: { path: string; }) => f.path === 'package.json');
        const hasReadme = files.some((f: { path: string; }) => f.path === 'README.md');

        if (hasPackageJson && hasReadme) {
            console.log('✅ SUCCESS: Fallback logic correctly identified priority files (package.json, README.md)');
        } else {
            console.error('❌ FAILURE: Fallback logic missed priority files.');
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ EXCEPTION during test:', e);
        process.exit(1);
    }
}

runTest();
