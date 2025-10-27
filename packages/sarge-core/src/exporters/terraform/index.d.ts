import { StackBlueprint } from '../../detector/schema';
type ExportOptions = {
    outDir: string;
    region?: string;
};
export declare function generateTerraformJson(bp: StackBlueprint, region?: string): {
    provider: {
        terraform: {
            required_providers: {
                aws: {
                    source: string;
                    version: string;
                };
            };
        };
        provider: {
            aws: {
                region: string;
            }[];
        };
    };
    s3: any;
    dynamo: any;
    lambda: any;
    services: any;
};
export declare function exportTerraform(bp: StackBlueprint, opts: ExportOptions): Promise<{
    files: string[];
}>;
export {};
