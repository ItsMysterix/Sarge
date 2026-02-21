
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRepositoryAnalyzer } from '../src/api/lib/ai-analyzer';

// Mock Octokit
const mockOctokit = {
    rest: {
        repos: {
            get: vi.fn(),
            getContent: vi.fn(),
        },
        git: {
            getTree: vi.fn(),
        },
    },
};

vi.mock('@octokit/rest', () => ({
    Octokit: vi.fn(() => mockOctokit),
}));

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
    return {
        default: class {
            messages = {
                create: vi.fn().mockResolvedValue({
                    content: [{ type: 'text', text: JSON.stringify({ summary: 'test' }) }]
                })
            }
        }
    }
});

// Mock Logger
vi.mock('../../lib/logger', () => ({
    aiLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AIRepositoryAnalyzer', () => {
    let analyzer: AIRepositoryAnalyzer;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
        analyzer = new AIRepositoryAnalyzer();
    });

    it('should use recursive tree fetch when available', async () => {
        // Setup mocks
        mockOctokit.rest.repos.get.mockResolvedValue({ data: { default_branch: 'main' } });
        mockOctokit.rest.git.getTree.mockResolvedValue({
            data: {
                tree: [
                    { path: 'package.json', type: 'blob', size: 100 },
                    { path: 'src/index.ts', type: 'blob', size: 200 },
                ],
            },
        });
        mockOctokit.rest.repos.getContent.mockImplementation(({ path }) => {
            if (!path) return Promise.reject(new Error('Root fetch not verified here'));
            return Promise.resolve({ data: 'file-content' });
        });

        // Execute
        const files = await analyzer['scanRepositoryViaAPI']('owner', 'repo', 'main', 'token');

        // Verify
        expect(mockOctokit.rest.git.getTree).toHaveBeenCalledWith({
            owner: 'owner',
            repo: 'repo',
            tree_sha: 'main',
            recursive: '1',
        });
        expect(files).toHaveLength(2);
        expect(files[0].path).toBe('package.json');
    });

    it('should fallback to non-recursive root scan if recursive fetch fails', async () => {
        // Setup mocks
        mockOctokit.rest.repos.get.mockResolvedValue({ data: { default_branch: 'main' } });
        // Simulate recursive fetch failure (e.g. 409 or large repo)
        mockOctokit.rest.git.getTree.mockRejectedValue(new Error('Git tree too large'));

        // Simulate root content list
        mockOctokit.rest.repos.getContent.mockImplementation(({ path }) => {
            // Root listing
            if (path === '') {
                return Promise.resolve({
                    data: [
                        { path: 'package.json', type: 'file', size: 100 },
                        { path: 'README.md', type: 'file', size: 500 },
                        { path: 'src', type: 'dir' }
                    ]
                });
            }
            // Content fetch
            return Promise.resolve({ data: 'file-content' });
        });

        // Execute
        const files = await analyzer['scanRepositoryViaAPI']('owner', 'repo', 'main', 'token');

        // Verify
        expect(mockOctokit.rest.git.getTree).toHaveBeenCalled(); // Tried recursive
        expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith(expect.objectContaining({ path: '' })); // Fell back to root
        expect(files).toHaveLength(2); // package.json and README.md (src skipped as dir)
        expect(files.map(f => f.path)).toContain('package.json');
        expect(files.map(f => f.path)).toContain('README.md');
    });

    it('should detect correct default branch', async () => {
        mockOctokit.rest.repos.get.mockResolvedValue({ data: { default_branch: 'develop' } });
        mockOctokit.rest.git.getTree.mockResolvedValue({ data: { tree: [] } });

        await analyzer['scanRepositoryViaAPI']('owner', 'repo', 'main', 'token');

        expect(mockOctokit.rest.git.getTree).toHaveBeenCalledWith(expect.objectContaining({
            tree_sha: 'develop'
        }));
    });
});
