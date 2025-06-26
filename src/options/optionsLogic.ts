// Import - Type
import type { AudioChunk } from "src/types";
import type { AudioBoxOptions } from "./optionsType";
// Import - Functions
import { secondsToTime, secondToLRCTime } from "src/utils";

/**
 * @param options AudioBox options to process
 * @returns Lines containing the options formatted as they will in codeblock
 */
export function formatOptions(options: AudioBoxOptions): string[] {
	// Convert newOptions object into an array
	// Special formatting are treated separetly
	const newOptionsArray = Object.entries(options)
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
						return `chunk: ${secondToLRCTime(
							chunk?.startTime
						)}-${secondToLRCTime(chunk?.endTime)}`;
					else return ``;
				default:
					return `${key}: ${value}`;
			}
		})
		.filter((option) => {
			if (option === ``) return false; // Delete empty strings
			return true;
		});
	newOptionsArray.push(""); // Add spacer
	return newOptionsArray;
}
