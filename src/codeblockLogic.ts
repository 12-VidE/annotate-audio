import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
// Import - Type
import type { AudioComment } from "./comment/commentType";
import type { AudioBoxOptions } from "./options/optionsType";
import type { AudioChunk } from "./types";
// Import - Function
import { secondsToTime } from "./utils";

/**
 * Find matching-groups inside code-block, line-by-line
 * @param source Codeblock content
 * @param regex Regex w/ 1+ matching group to apply inside code-block
 * @returns What's inside matching group. Each line may for an array IF there are 2+ matching groups
 */
export const getCodeBlockData = (
	source: string,
	regex: RegExp = /^.*$/
): Array<string | string[]> => {
	const codeblockLines = source.split("\n");
	if (codeblockLines)
		return codeblockLines
			.map((line: string) => {
				const match = regex.exec(line);
				if (match) {
					if (match.length === 2)
						// Only one capturing group → return it directly
						return match[1];
					else if (match.length > 2)
						// More than one capturing group → return an array
						return match.slice(1);
					// No capturing groups → return full match
					else return match[0];
				}
				// Fallback
				return null;
			})
			.filter(
				(result: any): result is string | string[] => result !== null
			);
	else return [""];
};

/**
 * Format the codeblock in a standard way
 * @param id
 * @param options
 * @param comments
 * @returns
 */
export function formatCodeblock(
	id: Readonly<string>,
	options: Readonly<AudioBoxOptions>,
	comments: AudioComment[]
): string[] {
	// Format - ID
	const idString: string = `#${id}`;

	// Format - Options (special formatting are treated separetly)
	const optionsStrings: string[] = Object.entries(options)
		.map(([key, value]) => {
			switch (key) {
				case "source":
					return `source: [[${value}]]`;
				case "title":
					if (value == undefined) return ``;
					else if (value == "") return `title: `;
					else return `title: ${value}`;
				case "chunk":
					const chunk = value as AudioChunk;
					if (chunk.endTime > chunk.startTime)
						return `chunk: ${secondsToTime(
							chunk?.startTime
						)}-${secondsToTime(chunk.endTime)}`;
					else return ``;
				default:
					return `${key}: ${value}`;
			}
		})
		.filter((option) => {
			if (option === ``) return false; // Delete empty strings
			return true;
		});

	// Format - Comments
	const commentsStrings: string[] = [...comments]
		.sort((x: AudioComment, y: AudioComment) => x.time - y.time)
		.map((comment) => {
			return `${comment.time} --- ${comment.content}`;
		});

	return [idString, ...optionsStrings, "", ...commentsStrings];
}

/**
 * Overwrite entire codeblock with new value
 * @param ctx
 * @param container
 * @param obsidianApp
 * @param codeblock
 * @returns
 */
export async function writeCodeblock(
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
