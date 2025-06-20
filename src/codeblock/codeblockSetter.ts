import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

/* 	##############
	▼▼ STANDARD functions to write TO note/codeblock
	#############  */
/**
 
 * Overwrite entire codeblock with new value
 * @param ctx
 * @param container
 * @param obsidianApp
 * @param codeblock Content of the codeblock you want to write
 */
export async function setCodeblock(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	obsidianApp: App,
	codeblock: string[]
): Promise<boolean> {
	// Get file full content
	const sectionInfo = ctx.getSectionInfo(container);
	if (!sectionInfo) return false;
	const lines = sectionInfo.text.split("\n");

	// Implement change into copy of file
	lines.splice(
		sectionInfo.lineStart + 1,
		sectionInfo.lineEnd - sectionInfo.lineStart - 1,
		...codeblock
	);

	// Get file & write the changes to it
	const file = obsidianApp.vault.getAbstractFileByPath(ctx.sourcePath);
	if (!file || !(file instanceof TFile)) return false;
	await obsidianApp.vault.modify(file, lines.join("\n"));

	return true;
}
