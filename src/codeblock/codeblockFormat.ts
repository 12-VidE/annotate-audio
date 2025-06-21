// Import - Type
import type { AudioComment } from "../comment/commentType";
import type { AudioBoxOptions } from "../options/optionsType";
import type { AudioChunk } from "../types";
// Import - Function
import { secondsToTime } from "../utils";

/* 	##############
	▼▼ STANDARD functions to format the codeblock
	#############  */

/**
 * Format the codeblock in a standard way
 * @param id
 * @param options
 * @param comments
 * @returns
 */
export function formatCodeblock(
	id: Readonly<string>,
	options: Readonly<AudioBoxOptions>,
	comments: AudioComment[]
): string[] {
	const idStrings = formatId(id);
	const optionsStrings = formatOptions(options);
	const commentsStrings = formatComments(comments);

	return [...idStrings, ...optionsStrings, "", ...commentsStrings];
}

/**
 * WHEN writing to the codeblock, format id in a standard way
 */
export function formatId(id: string): string[] {
	const idString: string = `#${id}`;
	return [idString];
}

/**
 * WHEN writing to the codeblock, format options in a standard way
 */
export function formatOptions(options: AudioBoxOptions): string[] {
	// Convert options object into an array
	// Special formatting are treated separetly
	const formattedOptions = Object.entries(options)
		.map(([key, value]) => {
			switch (key) {
				case "source":
					return `source: [[${value}]]`;
				case "title":
					if (value == undefined) return ``;
					else if (value == "") return `title: `;
					else return `title: ${value}`;
				case "chunk":
					const chunk = value as AudioChunk;
					if (chunk.endTime > chunk.startTime)
						return `chunk: ${secondsToTime(
							chunk?.startTime,
							3
						)}-${secondsToTime(chunk?.endTime, 3)}`;
					else return ``;
				default:
					return `${key}: ${value}`;
			}
		})
		.filter((option) => {
			if (option === ``) return false; // Delete empty strings
			return true;
		});
	return formattedOptions;
}

/**
 * WHEN writing to the codeblock, format comments in a standard way
 */
export function formatComments(comments: AudioComment[]): string[] {
	return [...comments]
		.sort((x: AudioComment, y: AudioComment) => x.time - y.time)
		.map((comment) => {
			return `${comment.time.toFixed(3)} --- ${comment.content}`;
		});
}
