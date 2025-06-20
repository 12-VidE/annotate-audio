import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
// Import - Type
import { AudioBoxOptions } from "./optionsType";
// Import - Functions
import { formatOptions } from "../codeblock/codeblockFormat";

/**
 * Write the options of a codeblock
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @param obsidianApp
 * @param newOptions - The new/modified codeblock options to write
 * @returns
 */
export async function setAudioboxOptions(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	obsidianApp: App,
	newOptions: AudioBoxOptions
): Promise<boolean> {
	// Get file full content
	const sectionInfo = ctx.getSectionInfo(container);
	if (!sectionInfo) return false;

	const lines = sectionInfo.text.split("\n");
	const codeblock = lines.slice(sectionInfo.lineStart, sectionInfo.lineEnd);

	try {
		// Count lines (of codeblock) until it finds first comment
		let optionsNumber: number | undefined = undefined;
		for (let i = 0; i < codeblock.length; i++) {
			if (/^\d+\s*---\s*.+$/.test(codeblock[i])) {
				optionsNumber = i - 1;
				break;
			}
		}
		if (!optionsNumber) optionsNumber = codeblock.length - 1; // WHEN there's no comments. Fallback to the codeblock length w/o extremes

		const newOptionsArray = formatOptions(newOptions);

		// Implement change into copy of file
		lines.splice(
			sectionInfo.lineStart + 2,
			optionsNumber - 1, // Remove the id
			...newOptionsArray
		);

		// Get file & write the changes to it
		const file = obsidianApp.vault.getAbstractFileByPath(ctx.sourcePath);
		if (!file || !(file instanceof TFile)) return false;
		await obsidianApp.vault.modify(file, lines.join("\n"));
	} catch (error) {
		console.error("Cannot manage properties - ", error);
	}
	return true;
}
