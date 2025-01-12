

export interface Metadata {
    [key: string]: string | string[];
}

export enum MetadataKey {
    Tags = "tags",
    Category = "category",
    Created = "created",
    WiseUpdated = "wiseupdated"
}


export class MetadataProcessor {
    private metadataBlockRegex: RegExp = /^---\n([\s\S]*?)\n---/;
    replaceMetadata(content: string, metadata: Metadata): string {
        let metadataText = this.toMarkdown(metadata);

        if (this.metadataBlockRegex.test(content)) {
            return content.replace(this.metadataBlockRegex, metadataText);
        } else {
            return `${metadataText}\n${content}`;
        }
    }
    extractMetadata(noteContent: string): Metadata {
        const metadata: Metadata = {};

        const metadataBlockMatch = this.metadataBlockRegex.exec(noteContent);
        if (!metadataBlockMatch) {
            console.log("No metadata block found.");
            return metadata;
        }

        const metadataBlock = metadataBlockMatch[1];

        // Split the metadata block into lines for processing
        const lines = metadataBlock.split("\n");
        let currentKey: string | null = null;
        let currentValues: string[] = [];

        for (const line of lines) {
            const keyValueMatch = /^(\w+):\s*(.*)$/.exec(line);

            if (keyValueMatch) {
                // If a new key is encountered, save the previous key's values
                if (currentKey && currentValues.length > 0) {
                    metadata[currentKey] = this.getCurrentValueOrValues(currentValues);
                }

                // Start processing a new key
                currentKey = keyValueMatch[1];
                currentValues = keyValueMatch[2].startsWith("-") ? [] : [keyValueMatch[2]];
            } else if (currentKey && line.startsWith("  -")) {
                // Handle multi-line list items (indented with "  -")
                currentValues.push(line.trim().slice(2));
            }
        }

        // Save the last key's values
        if (currentKey && currentValues.length > 0) {
            metadata[currentKey] = this.getCurrentValueOrValues(currentValues);
        }

        return metadata;
    }


    private getCurrentValueOrValues(currentValues: string[]): string | string[] {
        return currentValues.length > 1 ? currentValues.filter(x => x != '') : currentValues[0];
    }

    private toMarkdown(metadata: Metadata): string {
        let markdown = "---\n";

        for (const [key, value] of Object.entries(metadata)) {
            if (Array.isArray(value)) {
                markdown += `${key}:\n`;
                for (const item of value) {
                    markdown += `  - ${item}\n`;
                }
            } else {
                markdown += `${key}: ${value}\n`;
            }
        }

        markdown += "---";

        return markdown;
    }
}