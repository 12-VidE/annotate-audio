import { computed } from "vue";
import { MarkdownPostProcessorContext } from "obsidian";
// Import - Type
import type { AudioChunk } from "src/types";
// Import - Functions
import { secondsToTime } from "src/utils";
import { getTitleOption, getSourceOption } from "../Logic/codeblockFunc";

/* ---------------- */
/* --- Computed --- */
/* ---------------- */
/**
 * @param currentTime - sharedRef
 * @returns Time of the player
 */
export function displayCurrentTime(
	currentTime: Readonly<number>,
	maxTime?: number
) {
	return computed(() => {
		return secondsToTime(Math.floor(currentTime), maxTime);
	});
}

/**
 * @param chunk - sharedRef
 * @returns Time lenght of chunk
 */
export function displayDuration(chunk: Readonly<AudioChunk>, maxTime?: number) {
	return computed(() => {
		return secondsToTime(chunk.endTime, maxTime);
	});
}

/**
 * @returns title to be displayed (return false IF no title needs to be shown)
 */
export function displayTitle(
	source: string,
	title: string | undefined
): boolean | string {
	if (title === undefined) {
		// Show nothing IF there's no 'title' option
		return false;
	} else if (title === "") {
		// Use source (cleaning extension)
		const sourceValue = getSourceOption(source);
		return sourceValue!.replace(/\.[^/.]+$/, "");
	}
	// Return 'title' option IF specified
	return title;
}
