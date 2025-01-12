import { App, TFile } from "obsidian";
import { MetadataKey, MetadataProcessor } from "./metadata-processor";


export class CategoriesAndTags {
    categoryToTags: Map<string, Set<string>> = new Map<string, Set<string>>();
    categories: Set<string> = new Set<string>();
    tags: Set<string> = new Set<string>();
}

export class CategoryTagsCollector {
    metadataProcessor: MetadataProcessor;
    app: App;

    constructor(app: App) {
        this.metadataProcessor = new MetadataProcessor();
        this.app = app;
    }

    async collectCategoriesAndTags(): Promise<CategoriesAndTags> {
        const result = new CategoriesAndTags();

        const files = this.app.vault.getFiles();
        for (const file of files) {
            await this.extractCategoriesFromFile(file, result);
        }

        return result;
    }

    private async extractCategoriesFromFile(file: TFile, result: CategoriesAndTags) {
        const content = await this.app.vault.read(file);
        const metadata = this.metadataProcessor.extractMetadata(content);

        let category = null;
        if (metadata[MetadataKey.Category] != null) {
            let values = this.getValueAsArray(metadata[MetadataKey.Category]);

            category = values[0];
            values.forEach(x => {
                result.categories.add(x);
                if (!result.categoryToTags.has(x)) {
                    result.categoryToTags.set(x, new Set<string>());
                }
            });
        }

        if (metadata[MetadataKey.Tags] != null) {
            let values = this.getValueAsArray(metadata[MetadataKey.Tags]);

            values.forEach(x => {
                result.tags.add(x);
                if (category != null && !result.categoryToTags.has(category)) {
                    result.categoryToTags.get(category)?.add(x);
                }
            });
        }
    }

    private getValueAsArray(value: string | string[]): string[] {
        if (typeof value === 'string') {
            return [value];
        } else {
            return value;
        }
    }

}