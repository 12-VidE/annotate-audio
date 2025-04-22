// Import - Constants
import { DEFAULT_AUDIOBOX_OPTIONS } from "./optionsType";
// Import - Type
import { AudioChunk } from "src/types";
import type { AudioBoxOptions } from "./optionsType";
// Import - Function
import { getCodeBlockData } from "src/components/Logic/codeblockFunc";
import { timeToSeconds } from "src/utils";

/**
 * @returns Record of all the options saved inside codeblock
 */
export function getAudioboxOptions(
	source: string,
	maxDuration: number
): AudioBoxOptions {
	return {
		source: getSourceOption(source),
		// Player
		chunk: getChunkOption(source, maxDuration),
		volume: getVolumeOption(source),
		speed: getPlaybackSpeedOption(source),
		loop: getLoopOption(source),
		// UI
		layout: getLayoutOption(source),
		sticky: getStickyOption(source),
		title: getTitleOption(source),
		// Comments
		autoplay: getAutoplayOption(source),
		unstoppable: getUnstoppableOption(source),
	} as AudioBoxOptions;
}

/* ----------------- */
/* --- Secondary --- */
/* ----------------- */

/**
 * @returns Boundaries of the audio - default back to full audio
 */
function getChunkOption(
	source: string,
	maxDuration: number = 3600
): AudioChunk {
	// Check IF exists the option
	const chunkRegex = new RegExp(
		"^chunk: *(\\d{2}:\\d{2}:\\d{2}) *- *(\\d{2}:\\d{2}:\\d{2})$"
	);
	const chunkData = getCodeBlockData(source, chunkRegex)[0];
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
function getStickyOption(source: string): boolean {
	const stickyRegex = new RegExp("^sticky: *(True|False)$", "i");
	const stickyValue = String(getCodeBlockData(source, stickyRegex)[0]);
	if (!stickyValue) return DEFAULT_AUDIOBOX_OPTIONS.sticky;
	return stickyValue.toLowerCase() === "true";
}

/**
 * @returns Speed @ which to play the audio
 */
function getPlaybackSpeedOption(source: string): number {
	const playbackSpeedRegex = new RegExp("^speed: *([0-9.]*)$");
	const playbackSpeedValue = Number(
		getCodeBlockData(source, playbackSpeedRegex)[0]
	);
	if (!playbackSpeedValue) return DEFAULT_AUDIOBOX_OPTIONS.speed;
	return Math.round(playbackSpeedValue * 10) / 10; // Truncate to 1° decimal
}

/**
 * @returns Flag IF audio can loop
 */
function getLoopOption(source: string): boolean {
	const loopRegex = new RegExp("^loop: *(True|False)$", "i");
	const loopValue = String(getCodeBlockData(source, loopRegex)[0]);
	if (!loopValue) return DEFAULT_AUDIOBOX_OPTIONS.loop;
	return loopValue.toLowerCase() === "true";
}

/**
 * @returns Volume @ which play the audio
 */
function getVolumeOption(source: string): number {
	const volumeRegex = new RegExp("^volume: *([0-9.]*)$"); // It does not match negative values
	const volumeValue = Number(getCodeBlockData(source, volumeRegex)[0]);
	if (!volumeValue || volumeValue > 1) return DEFAULT_AUDIOBOX_OPTIONS.volume;
	return Math.round(volumeValue * 10) / 10; // Truncate to 1° decimal
}

function getAutoplayOption(source: string): boolean {
	const autoplayRegex = new RegExp("^autoplay: *(True|False)$", "i");
	const autoplayValue = String(getCodeBlockData(source, autoplayRegex)[0]);
	if (!autoplayValue) return DEFAULT_AUDIOBOX_OPTIONS.autoplay;
	return autoplayValue.toLowerCase() === "true";
}

function getUnstoppableOption(source: string): boolean {
	const unstoppableRegex = new RegExp("^unstoppable: *(True|False)$", "i");
	const unstoppableValue = String(
		getCodeBlockData(source, unstoppableRegex)[0]
	);
	if (!unstoppableValue) return DEFAULT_AUDIOBOX_OPTIONS.unstoppable;
	return unstoppableValue.toLowerCase() === "true";
}

/**
 * @returns title to display
 */
export function getTitleOption(source: string): string | undefined {
	const titleRegex = new RegExp("^title: *(.*)$");
	const titleValue = getCodeBlockData(source, titleRegex)[0];
	if (titleValue == undefined) return DEFAULT_AUDIOBOX_OPTIONS.title; // Useless BUT good practice
	return (titleValue as string).trim();
}

/**
 * @returns audio source
 */
export function getSourceOption(source: string): string | undefined {
	const sourceRegex = new RegExp("^source: *\\[\\[([^|\\]]+)\\]\\]$");
	const sourceValue = String(getCodeBlockData(source, sourceRegex)[0]);
	if (!sourceValue) return undefined;
	return sourceValue;
}
/**
 * @returns Index of what player layout to render
 */

export function getLayoutOption(source: string): number {
	const layoutRegex = new RegExp("^layout: *([0-9])$", "i");
	const layoutValue = Number(getCodeBlockData(source, layoutRegex)[0]);
	if (!layoutValue) return DEFAULT_AUDIOBOX_OPTIONS.layout;
	else return layoutValue;
}

/**
 * @returns Index of what player layout to render
 */
export function getAudioboxId(source: string): string | null {
	const idRegex = new RegExp("^#(\\S{16}) *$");
	const idValue = String(getCodeBlockData(source, idRegex)[0]);
	if (!idValue) return null;
	else return idValue;
}
