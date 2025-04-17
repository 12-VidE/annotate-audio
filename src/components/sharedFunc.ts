import { isRef } from "vue";

/* --------------- */
/* --- Methods --- */
/* --------------- */

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
