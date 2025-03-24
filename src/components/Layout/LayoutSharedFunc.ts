import { computed } from "vue";
import { MarkdownPostProcessorContext } from "obsidian";
// Import - Type
import type { AudioChunk } from "src/types";
// Import - Functions
import { secondsToTime } from "src/utils";
import { getTitleSetting, getSourceSetting } from "../Logic/codeblockFunc";

/* ---------------- */
/* --- Computed --- */
/* ---------------- */
/**
 * @param currentTime - sharedRef
 * @returns Time of the player
 */
export function displayCurrentTime(currentTime: Readonly<number>) {
	return computed(() => {
		return secondsToTime(Math.floor(currentTime));
	});
}

/**
 * @param chunk - sharedRef
 * @returns Time lenght of chunk
 */
export function displayDuration(chunk: Readonly<AudioChunk | undefined>) {
	return computed(() => {
		return secondsToTime(chunk?.endTime!);
	});
}

/**
 * @returns title to be displayed (return false IF no title needs to be shown)
 */
export function displayTitle(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
) {
	const title = getTitleSetting(ctx, container);
	if (title === undefined) {
		// Show nothing IF there's no 'title' option
		return false;
	} else if (title === "") {
		const sourceValue = getSourceSetting(ctx, container);
		if (typeof sourceValue === "string") {
			// Use source (cleaning extension)
			return sourceValue.replace(/\.[^/.]+$/, "");
		} else {
			// Use alias in the source (IF present)
			return sourceValue[1];
		}
	} else {
		// Return 'title' option IF specied
		return title;
	}
}
