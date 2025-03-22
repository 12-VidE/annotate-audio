import { computed } from "vue";
import { MarkdownPostProcessorContext } from "obsidian";
// Import - References
import { currentTime, chunk } from "../sharedRefs";
// Import - Functions
import { secondsToTime, timeToSeconds } from "src/utils";
import { getTitleSetting, getSourceSetting } from "../Logic/codeblockFunc";

/* ---------------- */
/* --- Computed --- */
/* ---------------- */
export const displayCurrentTime = computed(() => {
	return secondsToTime(Math.floor(currentTime.value));
});

export const displayDuration = computed(() => {
	return secondsToTime(chunk.value?.endTime!);
});

export function displayTitle(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
) {
	return computed(() => {
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
	});
}
