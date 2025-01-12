
import { App, TFile } from 'obsidian';
import PluginData from './plugin-data';
import OpenAI from 'openai';

export default class CategoryDeterminer {
    private app: App;
    private openAIClient: OpenAI;
    pluginData: PluginData;

    emptyResult: [string, string[]] = ["Uncategorized", ["tag1", "tag2"]];

    constructor(app: App, pluginData: PluginData) {
        this.app = app;
        this.pluginData = pluginData;;
        this.openAIClient = new OpenAI({
            apiKey: pluginData.settings.openAiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async determineCategory(
        content: string
    ): Promise<[string, string[]]> {
        if (this.pluginData.currentCall >= this.pluginData.maxCalls) {
            return this.emptyResult;
        }

        this.pluginData.currentCall++;

        const aiCategoryAndTags = await this.getSuggestedCategory(content);

        if (aiCategoryAndTags) {
            console.log(`AI suggested category: ${aiCategoryAndTags[0]} with tags: ${aiCategoryAndTags[1]}`);
            this.updateCategories(this.pluginData, aiCategoryAndTags[0], aiCategoryAndTags[1]);
            return aiCategoryAndTags;
        }

        return this.emptyResult;
    }

    private async getSuggestedCategory(content: string): Promise<[string, string[]] | null> {
        const categories = Array.from(this.pluginData.categoriesAndTags.categories).join(", ");
        const tags = Array.from(this.pluginData.categoriesAndTags.tags).join(", ");

        try {
            const completion = await this.openAIClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Ты определяешь категории и теги моих личных заметок. 
                        Существующие категории: [${categories}]. 
                        Выбери одну из представленных категорий или определи новую категорию.
                        Существующие теги: [${tags}].
                        Выбери подходящие теги из представленных тегов или дополни новым тегами.
                        Ответ должен содержать название категории на первой строчке и на второй строчке набор тегов, раздленных запятой.
                        Пример ответа:
                        Художественные книги
                        книги, художественные, литература, Достоевский
                        ` },
                    {
                        role: "user",
                        content: "Заметка.  " + content,
                    },
                ],
            });

            let aiResponse = completion.choices[0]?.message?.content || null;
            if (!aiResponse) {
                return null;
            }


            let responses = aiResponse.split("\n");
            let aiCategory = responses[0].toLowerCase().trim();
            let aiTags = responses[1].split(",")
                .map(tag => this.sanitizeTag(tag))
                .filter(x => x != "");

            return [aiCategory, aiTags];
        } catch (error) {
            console.error("Error while fetching AI category:", error);
            return null;
        }
    }


    private sanitizeTag(tag: string): string {
        return tag
            .trim()
            .toLowerCase()
            .replace(" ", "_")
            .replace(".", "_");
    }

    updateCategories(pluginData: PluginData, newCategory: string, tags: string[]) {
        if (!pluginData.categoriesAndTags.categories.has(newCategory)) {
            pluginData.categoriesAndTags.categories.add(newCategory);
        }

        tags.forEach(tag => {
            if (!pluginData.categoriesAndTags.tags.has(tag)) {
                pluginData.categoriesAndTags.tags.add(tag);
            }
        });

        console.log(`Category "${newCategory}" updated with tags: ${tags}`);
    }
}