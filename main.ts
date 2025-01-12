import { Plugin, TFile } from 'obsidian';
import PluginData from './src/plugin-data';
import { NoteProcessor } from './src/note-processor';
import { CategoryTagsCollector } from './src/category-tags-collector';
import { WiseSettingTab } from './src/wise-setting-tab';
import { DEFAULT_SETTINGS, WisePluginSettings } from './src/wise-plugin-settings';

export default class WisePlugin extends Plugin {
	settings: WisePluginSettings;
	pluginData: PluginData;
	noteProcessor: NoteProcessor;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new WiseSettingTab(this.app, this));

		if (this.settings.openAiKey === '') {
			console.log("Open AI key is not set");
			const statusBarItemElement = this.addStatusBarItem();
			statusBarItemElement.setText('Open AI key is not set');
			return;
		}

		this.pluginData = new PluginData();
		this.pluginData.settings = this.settings;

		setTimeout(async () => {
			this.pluginData.categoriesAndTags = await new CategoryTagsCollector(this.app).collectCategoriesAndTags();
		}, 100);

		this.noteProcessor = new NoteProcessor(this.app, this.pluginData);

		this.app.workspace.onLayoutReady(this.workspaceOnLayoutReady.bind(this));
	}


	workspaceOnLayoutReady() {
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.noteProcessor.onCreate(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.noteProcessor.onModify(file);
				}
			})
		);
	}


	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}