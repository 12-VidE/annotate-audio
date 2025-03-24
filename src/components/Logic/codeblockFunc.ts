import { MarkdownPostProcessorContext } from "obsidian";
import { defaultAudioBoxOptions } from "src/types";
// Import - Func
import { timeToSeconds } from "src/utils";
// Import - Type
import type { AudioChunk } from "src/types";

/* ------------ */
/* --- Main --- */
/* ------------ */

/**
 * Find matching-groups inside code-block, line-by-line
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @param regex - Regex w/ 1+ matching group to apply inside code-block
 * @returns What's inside matching group. Each line may for an array IF there are 2+ matching groups
 */
export const getCodeBlockData = (
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	regex: RegExp = /^.*$/
): Array<string | string[]> => {
	const sectionInfo = ctx.getSectionInfo(container);
	const lines = sectionInfo?.text
		.split("\n")
		.slice(sectionInfo.lineStart + 1, sectionInfo.lineEnd);
	if (lines)
		return lines
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

/* ------------------- */
/* --- Specialized --- */
/* ------------------- */

/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns Boundaries of the audio - default back to full audio
 */
export async function getChunkSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): Promise<AudioChunk | undefined> {
	// Check IF exists the option
	const chunkRegex = new RegExp(
		"^chunk: *(\\d{2}:\\d{2}:\\d{2}) *- *(\\d{2}:\\d{2}:\\d{2})$"
	);
	const chunkData = getCodeBlockData(ctx, container, chunkRegex)[0];
	if (chunkData === undefined)
		return defaultAudioBoxOptions.chunk; // Useless BUT good practice
	else {
		// IF the option exists
		const startTime = timeToSeconds(chunkData[0]);
		const endTime = timeToSeconds(chunkData[1]);
		if (startTime >= endTime) {
			// IF out of boundary: fall back to default
			console.warn("Annotate-Audio: Impossible audio chunk");
			return defaultAudioBoxOptions.chunk; // Useless BUT good practice
		} else
			return {
				startTime,
				endTime,
				duration: endTime - startTime,
			} as AudioChunk;
	}
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns Flag IF audio-controls are sticky
 */
export function getStickySetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): boolean {
	const stickyRegex = new RegExp("^sticky: *(True|False)$", "i");
	const stickyValue = String(
		getCodeBlockData(ctx, container, stickyRegex)[0]
	);
	if (!stickyValue) return defaultAudioBoxOptions.sticky;
	return stickyValue.toLowerCase() === "true";
}
/**
 *  @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns Speed @ which to play the audio
 */
export function getPlaybackSpeedSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): number {
	const playbackSpeedRegex = new RegExp("^speed: *([0-9.]*)$");
	const playbackSpeedValue = Number(
		getCodeBlockData(ctx, container, playbackSpeedRegex)[0]
	);
	if (!playbackSpeedValue) return defaultAudioBoxOptions.speed;
	return Math.round(playbackSpeedValue * 10) / 10; // Truncate to 1° decimal
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns Flag IF audio can loop
 */
export function getLoopSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): boolean {
	const loopRegex = new RegExp("^loop: *(True|False)$", "i");
	const loopValue = String(getCodeBlockData(ctx, container, loopRegex)[0]);
	if (!loopValue) return defaultAudioBoxOptions.loop;
	return loopValue.toLowerCase() === "true";
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns Volume @ which play the audio
 */
export function getVolumeSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): number {
	const volumeRegex = new RegExp("^volume: *([0-9.]*)$"); // It does not match negative values
	const volumeValue = Number(
		getCodeBlockData(ctx, container, volumeRegex)[0]
	);
	if (!volumeValue || volumeValue > 1) return defaultAudioBoxOptions.volume;
	return Math.round(volumeValue * 10) / 10; // Truncate to 1° decimal
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns title to display
 */
export function getTitleSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): string | undefined {
	const titleRegex = new RegExp("^title: *(.*)$");
	const titleValue = getCodeBlockData(ctx, container, titleRegex)[0];
	if (titleValue == undefined) return defaultAudioBoxOptions.title; // Useless BUT good practice
	return (titleValue as string).trim();
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns audio source
 */
export function getSourceSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): Array<string> | string {
	const surceRegex = new RegExp(
		"^source: *\\[\\[([^|\\]]+)(?:\\|([^\\]]*))?\\]\\]$"
	);
	const sourceValue = getCodeBlockData(ctx, container, surceRegex)[0];
	if (sourceValue[1] && sourceValue[1].length > 0)
		return sourceValue; // Return both file-name and alias (if present)
	else return sourceValue[0]; // Return only file-name (if alias doesn't exists)
	// Notice it cannot be undefined CAUSE it must exists
}
/**
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @returns what player layout to display
 */
export function getLayoutSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): number {
	const layoutRegex = new RegExp("^layout: *([1-9])$", "i");
	const layoutValue = Number(
		getCodeBlockData(ctx, container, layoutRegex)[0]
	);
	if (!layoutValue) return defaultAudioBoxOptions.layout;
	else return layoutValue;
}
