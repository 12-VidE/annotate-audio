import { getCodeBlockData } from "src/codeblockLogic";
import { AudioComment } from "./commentType";
import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

/**
 * @returns Array of all (sorted) comments
 */
export function getComments(source: string): Array<AudioComment> {
	const commentRegex = new RegExp("^(.+) --- (.+)$");
	// Get comments FROM codeblock
	// Format comment into AudioComment
	// Sort comment by time (just to make sure, they should already be in order)
	const commentsArray = getCodeBlockData(source, commentRegex)
		.map((item) => {
			if (Array.isArray(item)) {
				return {
					time: Number(item[0]),
					content: String(item[1]),
				} as AudioComment;
			}
			// Fallback
			return null;
		})
		.filter((item): item is AudioComment => item !== null)
		.sort((x: AudioComment, y: AudioComment) => x.time - y.time);
	return commentsArray;
}

/**
 * Function that actually operate on codeblock
 * (Re)Writing/Cancelling 1 comment
 * @param commentOnFocus Comment to work with. If .content = empty → It deletes the comment
 * @param isNew True: dealing w/ a new comment | False: dealing w/ an already existsing comment
 */
export async function writeCommentsArray(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	obsidianApp: App,
	commentsArray: AudioComment[]
): Promise<boolean> {
	// Get file full content
	const sectionInfo = ctx.getSectionInfo(container);
	if (!sectionInfo) {
		return false;
	}
	const lines = sectionInfo.text.split("\n");

	try {
		const commentOnFocusAbsoluteLine =
			sectionInfo.lineEnd - commentsArray.length; // Line WHERE the comment is place inside the entire file

		// Check IF it's within bounds
		if (
			commentOnFocusAbsoluteLine <
				sectionInfo.lineEnd - commentsArray.length ||
			commentOnFocusAbsoluteLine > sectionInfo.lineEnd
		)
			return false;

		// Implement change into file
		lines.splice(
			commentOnFocusAbsoluteLine,
			commentsArray.length,
			...commentsArray.map((comment) => {
				return `${comment.time} --- ${comment.content}`;
			})
		); // IF adding/modifying

		// Get file & write the changes to it
		const file = obsidianApp.vault.getAbstractFileByPath(ctx.sourcePath);
		if (!file || !(file instanceof TFile)) return false;
		console.log(lines);
		await obsidianApp.vault.modify(file, lines.join("\n"));
	} catch (error) {
		console.error("Cannot manage comment - ", error);
	}
	return true;
}
