import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import { defaultAudioBoxOptions } from "src/options";
// Import - Func
import { secondsToTime, timeToSeconds } from "src/utils";
// Import - Type
import type { AudioChunk } from "src/types";
import type { AudioBoxOptions } from "src/options";

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
	const codeblockLines = sectionInfo?.text
		.split("\n")
		.slice(sectionInfo.lineStart + 1, sectionInfo.lineEnd);
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
 * @returns Record of all the options saved inside codeblock
 */
export function getAudioboxOptions(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	maxDuration: number
): AudioBoxOptions {
	return {
		volume: getVolumeSetting(ctx, container),
		speed: getPlaybackSpeedSetting(ctx, container),
		loop: getLoopSetting(ctx, container),
		sticky: getStickySetting(ctx, container),
		title: getTitleSetting(ctx, container),
		layout: getLayoutSetting(ctx, container),
		chunk: getChunkSetting(ctx, container, maxDuration),
		autoplay: getAutoplaySetting(ctx, container),
	} as AudioBoxOptions;
}

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
		if (!optionsNumber) optionsNumber = codeblock.length - 2; // WHEN there's no comment. Fallback to the codeblock lenght wihtout extremes

		// Convert newOptions object into an array
		// Special formatting are treated separetly
		const newOptionsArray = Object.entries(newOptions)
			.map(([key, value]) => {
				switch (key) {
					case "title":
						if (value == undefined) return ``;
						else if (value == "") return `title: `;
						else return `title: ${value}`;
					case "chunk":
						const chunk = value as AudioChunk;
						if (chunk.endTime > chunk.startTime)
							return `chunk: ${secondsToTime(
								chunk?.startTime
							)}-${secondsToTime(chunk?.endTime)}`;
						else return ``;
					default:
						return `${key}: ${value}`;
				}
			})
			.filter((option) => {
				if (option === ``) return false; // Delete empty strings
				return true;
			});
		newOptionsArray.push("");

		// Implement change into copy of file
		lines.splice(
			sectionInfo.lineStart + 2,
			optionsNumber - 1,
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

/* ------------------- */
/* --- Get Options --- */
/* ------------------- */

/**
 * @returns Boundaries of the audio - default back to full audio
 */
function getChunkSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	maxDuration: number
): AudioChunk {
	// Check IF exists the option
	const chunkRegex = new RegExp(
		"^chunk: *(\\d{2}:\\d{2}:\\d{2}) *- *(\\d{2}:\\d{2}:\\d{2})$"
	);
	const chunkData = getCodeBlockData(ctx, container, chunkRegex)[0];
	if (chunkData !== undefined) {
		// IF the option exists
		const startTime = timeToSeconds(chunkData[0]);
		const endTime = timeToSeconds(chunkData[1]);
		if (startTime >= endTime) {
			// IF out of boundary
			console.warn("Annotate-Audio: Impossible audio chunk");
		} else
			return {
				startTime,
				endTime,
				duration: endTime - startTime,
			} as AudioChunk;
	}
	// Fallback - It's the entire audiofile
	return {
		startTime: 0,
		endTime: maxDuration,
		duration: maxDuration,
	};
}
/**
 * @returns Flag IF audio-controls are sticky
 */
function getStickySetting(
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
 * @returns Speed @ which to play the audio
 */
function getPlaybackSpeedSetting(
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
 * @returns Flag IF audio can loop
 */
function getLoopSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): boolean {
	const loopRegex = new RegExp("^loop: *(True|False)$", "i");
	const loopValue = String(getCodeBlockData(ctx, container, loopRegex)[0]);
	if (!loopValue) return defaultAudioBoxOptions.loop;
	return loopValue.toLowerCase() === "true";
}
/**
 * @returns Volume @ which play the audio
 */
function getVolumeSetting(
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
 * @returns Flag IF audio can autoplay WHEN selecting a comment
 */
function getAutoplaySetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): boolean {
	const autoplayRegex = new RegExp("^autoplay: *(True|False)$", "i");
	const autoplayValue = String(
		getCodeBlockData(ctx, container, autoplayRegex)[0]
	);
	if (!autoplayValue) return defaultAudioBoxOptions.autoplay;
	return autoplayValue.toLowerCase() === "true";
}

/**
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
 * @returns audio source
 */
export function getSourceSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): Array<string> | string | undefined {
	const sourceRegex = new RegExp(
		"^source: *\\[\\[([^|\\]]+)(?:\\|([^\\]]*))?\\]\\]$"
	);
	const sourceValue = getCodeBlockData(ctx, container, sourceRegex)[0];
	if (!sourceValue) return undefined;
	else if (sourceValue[1])
		return sourceValue; // Return both file-name and alias (if present)
	else return sourceValue[0]; // Return only file-name (if alias doesn't exists)
}
/**
 * @returns Index of what player layout to render
 */
export function getLayoutSetting(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): number {
	const layoutRegex = new RegExp("^layout: *([0-9])$", "i");
	const layoutValue = Number(
		getCodeBlockData(ctx, container, layoutRegex)[0]
	);
	if (!layoutValue) return defaultAudioBoxOptions.layout;
	else return layoutValue;
}
