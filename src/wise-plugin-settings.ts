export interface WisePluginSettings {
    folderPaths: string;
    openAiKey: string;
}

export const DEFAULT_SETTINGS: WisePluginSettings = {
    openAiKey: 'default',
    folderPaths: './'
};
