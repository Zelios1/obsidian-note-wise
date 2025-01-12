import { CategoriesAndTags } from "./category-tags-collector";
import { WisePluginSettings } from "./wise-plugin-settings";

export default class PluginData {
    settings: WisePluginSettings;
    fileLocker: Map<string, boolean> = new Map<string, boolean>();
    maxCalls: number = 2;
    currentCall: number = 0;
    categoriesAndTags: CategoriesAndTags;
}