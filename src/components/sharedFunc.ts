import { getCodeBlockData } from "./Logic/codeblockFunc";
import { MarkdownPostProcessorContext } from "obsidian";
// Import - Type
import type { AudioComment } from "src/types";
import { isRef } from "vue";

/* --------------- */
/* --- Methods --- */
/* --------------- */

/**
 * @returns Array of all (sorted) comments
 */
export function getCommentsArray(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement
): Array<AudioComment> {
	const commentRegex = new RegExp("^(.+) --- (.+)$");
	// Get comments FROM codeblock
	// Format comment into AudioComment
	// Sort comment by time (just to make sure, they should already be in order)
	return getCodeBlockData(ctx, container, commentRegex)
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
}

/**
 * DEBUG - Print all shared references
 * @param refs = sharedRefs
 */
export function logRefs(refs: Record<string, any>): void {
	Object.keys(refs).forEach((key) => {
		const value = refs[key];
		console.log(key, isRef(value) ? value.value : value);
	});
}
