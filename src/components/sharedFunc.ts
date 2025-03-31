import { getCodeBlockData } from "./Logic/codeblockFunc";
import { MarkdownPostProcessorContext, TFile } from "obsidian";
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
	const commentsArray = getCodeBlockData(ctx, container, commentRegex)
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

/**
 * DEBUG - Print all shared references
 * @param refs = sharedRefs
 */
export function logRefs(refs: Record<string, any>): void {
	const logObj: Record<string, any> = {};
	Object.keys(refs).forEach((key) => {
		const value = refs[key];
		logObj[key] = isRef(value) ? value.value : value;
	});
	console.log(logObj);
}

/**
 * "fastly" retrive duration by reading file metadata
 * @param file Audio file (not checked)
 * @returns Duration of the audio
 */
export async function retriveDuration(file: string): Promise<number> {
	let duration: number = 0;
	try {
		const tempAudioPlayer = new Audio(); // Temporary player
		tempAudioPlayer.src = file;
		tempAudioPlayer.preload = "metadata"; // Impose metadata loading
		duration = await new Promise((resolve) => {
			tempAudioPlayer.onloadedmetadata = () => {
				// WHEN metadata is loaded, return the duration
				resolve(tempAudioPlayer.duration);
			};
		});
	} catch (error) {
		console.error("retriveDuration: ", error);
	}
	return duration;
}
