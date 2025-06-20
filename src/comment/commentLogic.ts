// Import - Type
import type { AudioComment } from "./commentType";
// Import - Function
import { getCodeblockData } from "../codeblock/codeblockGetter";

/**
 * @returns Array of all (sorted) comments
 */
export function getComments(source: string): Array<AudioComment> {
	const commentRegex = new RegExp("^(.+) --- (.+)$");
	// Get comments FROM codeblock
	// Format comment into AudioComment
	// Sort comment by time (just to make sure, they should already be in order)
	const commentsArray = getCodeblockData(source, commentRegex)
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
