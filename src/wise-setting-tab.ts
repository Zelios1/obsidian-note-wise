import WisePlugin from 'main';
import { PluginSettingTab, App, Setting } from 'obsidian';

export class WiseSettingTab extends PluginSettingTab {
    plugin: WisePlugin;

    constructor(app: App, plugin: WisePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key')
            .addText(text => text
                .setPlaceholder('Enter your key')
                .setValue(this.plugin.settings.openAiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openAiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Path of folders to process')
            .setDesc('Comma-separated list of folder paths to process')
            .addText(text => text
                .setPlaceholder('./, ./work-notes')
                .setValue(this.plugin.settings.folderPaths)
                .onChange(async (value) => {
                    this.plugin.settings.folderPaths = value;
                    await this.plugin.saveSettings();
                }));
    }
}
