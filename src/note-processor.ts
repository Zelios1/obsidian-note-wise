import { App, TFile } from "obsidian";
import PluginData from "./plugin-data";
import CategoryDeterminer from "./category-determiner";
import { MetadataKey, MetadataProcessor } from "./metadata-processor";


export class NoteProcessor {
    private debounceMapWithTime: Map<string, [timer: ReturnType<typeof setTimeout>, delay: number]> = new Map();
    private pluginData: PluginData;
    private app: App;
    private debounceFactor: number = 1.5;

    private categoryDeterminer: CategoryDeterminer;
    private metadataProcessor: MetadataProcessor;

    constructor(app: App, pluginData: PluginData) {
        this.app = app;
        this.pluginData = pluginData;
        this.categoryDeterminer = new CategoryDeterminer(app, pluginData);
        this.metadataProcessor = new MetadataProcessor();
    }

    onCreate(file: TFile) {
        if (!this.canBeProcessed(file)) {
            return;
        }

        this.processFile(file);
    }

    onModify(file: TFile) {
        if (!this.canBeProcessed(file)) {
            return;
        }
        let debounceTime = 1000;
        if (this.debounceMapWithTime.has(file.path)) {
            debounceTime = this.debounceMapWithTime.get(file.path)?.[1] || debounceTime;
            clearTimeout(this.debounceMapWithTime.get(file.path)?.[0]);
        }

        const nextDebounceTimer = debounceTime * this.debounceFactor;
        const nextCall = setTimeout(async () => {
            await this.processFile(file);
        }, nextDebounceTimer);

        this.debounceMapWithTime.set(file.path, [nextCall, nextDebounceTimer]);
    }

    private canBeProcessed(file: TFile): boolean {
        var paths = this.pluginData.settings.folderPaths.split(",");
        if (paths.length == 0) {
            return true;
        }

        let folderPath = "./" + file.path.split("/").slice(0, -1).join("/");
        return file.extension === "md" && paths.some(x => {
            return x.includes(folderPath);
        });
    }

    private async processFile(file: TFile) {
        this.tryLockFileAndInvoke(file.path, async () => {
            const content = await this.app.vault.read(file);
            const updatedContent = await this.contentProcessor(content);
            if (content != updatedContent) {
                await this.app.vault.modify(file, updatedContent);
            }
        });
    }

    private async contentProcessor(content: string): Promise<string> {
        var metadata = this.metadataProcessor.extractMetadata(content);

        metadata[MetadataKey.Created] = metadata[MetadataKey.Created] || new Date().toISOString();
        let wiseUpdatedDate = metadata[MetadataKey.WiseUpdated] as string;
        const Day1InMs = 24 * 60 * 60 * 1000;
        if (!wiseUpdatedDate || new Date(wiseUpdatedDate).getTime() < Date.now() - Day1InMs) {
            metadata[MetadataKey.WiseUpdated] = new Date().toISOString();

            let categoryAndTags = await this.categoryDeterminer.determineCategory(content);
            metadata[MetadataKey.Category] = categoryAndTags[0];
            metadata[MetadataKey.Tags] = categoryAndTags[1]
        }

        return this.metadataProcessor.replaceMetadata(content, metadata);
    }

    private tryLockFileAndInvoke(path: string, fn: () => Promise<void>) {
        if (this.pluginData.fileLocker.has(path)) {
            console.log(`File ${path} is locked. Skipping.`);
            return;
        }

        this.pluginData.fileLocker.set(path, true);
        fn()
            .finally(() => {
                //clear lock after 4 s
                setTimeout(() => {
                    this.pluginData.fileLocker.delete(path);
                }, 4000);
            });
    }
}


