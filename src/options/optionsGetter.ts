// Import - Constants
import { DEFAULT_AUDIOBOX_OPTIONS } from "./optionsType";
import {
	sourceRegex,
	chunkNativeRegex,
	chunkLRCRegex,
	volumeRegex,
	playbackSpeedRegex,
	loopRegex,
	layoutRegex,
	stickyRegex,
	titleRegex,
	decimalsRegex,
	autoplayRegex,
	unstoppableRegex,
	idRegex,
} from "src/regex";
// Import - Type
import { AudioChunk } from "src/types";
import type { AudioBoxOptions } from "./optionsType";
// Import - Function
import { getCodeblockData } from "../codeblock/codeblockGetter";
import { timeToSeconds } from "src/utils";

/* 	##############
	▼▼ All these functions relay on getCodeblockData. None actually read the codeblock, just a copy of it
	#############  */

/**
 * @returns Record of all the options saved inside codeblock
 */
export function getAudioboxOptions(
	source: string,
	maxDuration: number | undefined = undefined
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
		decimals: getDecimalsOption(source),
		// Comments
		autoplay: getAutoplayOption(source),
		unstoppable: getUnstoppableOption(source),
	} as AudioBoxOptions;
}

/* ----------------- */
/* --- Secondary --- */
/* ----------------- */
/**
 * @returns audio source
 */
export function getSourceOption(source: string): string | undefined {
	const sourceValue = String(getCodeblockData(source, sourceRegex)[0]);
	if (!sourceValue) return undefined;
	return sourceValue;
}

/** (Player)
 * @returns Boundaries of the audio - default back to full audio
 */
function getChunkOption(
	source: string,
	maxDuration: number = 3600
): AudioChunk {
	// Default to entire audio
	let startTime: number = 0;
	let endTime: number = maxDuration;

	// Check IF exists the option
	// Support (deprecated) native and LRC format
	const chunkData =
		getCodeblockData(source, chunkNativeRegex)[0] ||
		getCodeblockData(source, chunkLRCRegex)[0];
	if (chunkData !== undefined) {
		startTime = timeToSeconds(chunkData[0]);
		endTime = timeToSeconds(chunkData[1]);
		if (startTime >= endTime) {
			// IF out of boundary
			console.warn("Annotate-Audio: Impossible audio chunk");
		}
	}
	return {
		startTime,
		endTime,
	} as AudioChunk;
}

/** (Player)
 * @returns Volume @ which play the audio
 */
function getVolumeOption(source: string): number {
	const volumeValue = Number(getCodeblockData(source, volumeRegex)[0]);
	if (!volumeValue || volumeValue > 1) return DEFAULT_AUDIOBOX_OPTIONS.volume;
	return Math.round(volumeValue * 10) / 10; // Round to 1° decimal
}

/** (Player)
 * @returns Speed @ which to play the audio
 */
function getPlaybackSpeedOption(source: string): number {
	const playbackSpeedValue = Number(
		getCodeblockData(source, playbackSpeedRegex)[0]
	);
	if (!playbackSpeedValue) return DEFAULT_AUDIOBOX_OPTIONS.speed;
	return Math.round(playbackSpeedValue * 10) / 10; // Truncate to 1° decimal
}

/** (Player)
 * @returns Flag IF audio can loop
 */
function getLoopOption(source: string): boolean {
	const loopValue = String(getCodeblockData(source, loopRegex)[0]);
	if (!loopValue) return DEFAULT_AUDIOBOX_OPTIONS.loop;
	return loopValue.toLowerCase() === "true";
}

/** (UI)
 * @returns Index of what player layout to render
 */
export function getLayoutOption(source: string): number {
	const layoutValue = Number(getCodeblockData(source, layoutRegex)[0]);
	if (!layoutValue) return DEFAULT_AUDIOBOX_OPTIONS.layout;
	else return layoutValue;
}

/** (UI)
 * @returns Flag IF audio-controls are sticky
 */
function getStickyOption(source: string): boolean {
	const stickyValue = String(getCodeblockData(source, stickyRegex)[0]);
	if (!stickyValue) return DEFAULT_AUDIOBOX_OPTIONS.sticky;
	return stickyValue.toLowerCase() === "true";
}

/** (UI)
 * @returns title to display
 */
export function getTitleOption(source: string): string | undefined {
	const titleValue = getCodeblockData(source, titleRegex)[0];
	if (titleValue == undefined) return DEFAULT_AUDIOBOX_OPTIONS.title; // Useless BUT good practice
	return (titleValue as string).trim();
}

/** (UI)
 * @returns How many decimals to show in time (btw 0-3)
 */
function getDecimalsOption(source: string): number {
	const decimalsValue = Number(getCodeblockData(source, decimalsRegex)[0]);
	if (!decimalsValue) return DEFAULT_AUDIOBOX_OPTIONS.decimals;
	return decimalsValue;
}

/** (Comments)
 * @returns Flag IF resume player WHEN selecting a comment
 */
function getAutoplayOption(source: string): boolean {
	const autoplayValue = String(getCodeblockData(source, autoplayRegex)[0]);
	if (!autoplayValue) return DEFAULT_AUDIOBOX_OPTIONS.autoplay;
	return autoplayValue.toLowerCase() === "true";
}

/** (Comments)
 * @returns Flag IF the player can continue WHEN editing a comment
 */
function getUnstoppableOption(source: string): boolean {
	const unstoppableValue = String(
		getCodeblockData(source, unstoppableRegex)[0]
	);
	if (!unstoppableValue) return DEFAULT_AUDIOBOX_OPTIONS.unstoppable;
	return unstoppableValue.toLowerCase() === "true";
}

/**
 * @returns Index of what player layout to render
 */
export function getAudioboxId(source: string): string | null {
	const idValue = String(getCodeblockData(source, idRegex)[0]);
	if (!idValue) return null;
	else return idValue;
}
