// Import - Type
import type { AudioComment } from "./commentType";
// Import - Function
import { getCodeblockData } from "../codeblock/codeblockGetter";
import { timeToSeconds } from "src/utils";

/**
 * @returns Array of all (sorted) comments
 */
export function getComments(source: string): Array<AudioComment> {
	// Support both (deprecated) native and LRC format
	const commentNativeRegex = new RegExp("^(.+) --- (.+)$");
	const commentLCRegex = new RegExp("^\\[(\\d{2,}:\\d{2}.\\d{1,3})\\](.+)$");

	// Get comments FROM codeblock
	// Format comment into AudioComment
	const commentsNativeArray = getCodeblockData(
		source,
		commentNativeRegex
	).map((item) => {
		if (Array.isArray(item) && item.length === 2) {
			return {
				time: Number(item[0]),
				content: String(item[1]),
			} as AudioComment;
		}
		// Fallback
		return null;
	});
	const commentsLRCRegex = getCodeblockData(source, commentLCRegex).map(
		(item) => {
			if (Array.isArray(item) && item.length === 2) {
				return {
					time: timeToSeconds(item[0]),
					content: String(item[1]),
				} as AudioComment;
			}
			// Fallback
			return null;
		}
	);
	// Remove empty ones
	// Sort comment by time
	const formattedCommentsArray = commentsNativeArray
		.concat(commentsLRCRegex)
		.filter((item): item is AudioComment => item !== null)
		.sort((x: AudioComment, y: AudioComment) => x.time - y.time);
	return formattedCommentsArray;
}
