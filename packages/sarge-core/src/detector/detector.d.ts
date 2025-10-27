import { type StackBlueprint } from './schema';
export interface DetectOptions {
    overrides?: Partial<StackBlueprint>;
    maxFiles?: number;
}
export declare function detectStack(repoPath: string, opts?: DetectOptions): Promise<StackBlueprint>;
