import { setIcon, setTooltip, TooltipOptions } from "obsidian";
import { isRef } from "vue";
import { hash } from "spark-md5";

/* ------------------ */
/* --- Conversion --- */
/* ------------------ */

/**
 * Converts HH:mm:ss into ss
 * @param {string} str
 * @returns {number}
 */
export function timeToSeconds(str: string): number {
	const nums = str.split(":").map((x) => Number.parseInt(x));
	return nums[2] + nums[1] * 60 + nums[0] * 3600;
}

/**
 * Converts ss into HH:mm:ss OR as short as possible
 * @param num - Input to convert
 * @param max - WHEN present, num is strip down to fit "max" format
 * @returns {string}
 */
export function secondsToTime(num: number, max?: number): string {
	num = Math.floor(num);

	if (max && max > 0 && max < 60) {
		// ss OR s
		let ss = String(num % 60);
		if (max >= 10) ss = ss.padStart(2, "0");
		return `${ss}`;
	} else if (max && max < 360) {
		// mm:ss OR m:ss
		const ss = String(num % 60).padStart(2, "0");
		let mm = String(Math.floor((num % 3600) / 60));
		if (max >= 600) mm = mm.padStart(2, "0");
		return `${mm}:${ss}`;
	} else {
		// HH:mm:ss OR H:mm:ss
		const ss = String(num % 60).padStart(2, "0");
		const mm = String(Math.floor((num % 3600) / 60)).padStart(2, "0");
		let HH = String(Math.floor(num / 3600));
		if (!max || max >= 36000) HH = HH.padStart(2, "0");
		return `${HH}:${mm}:${ss}`;
	}
}

/* ------------ */
/* --- Hash --- */
/* ------------ */

/**
 * @param obj - Input to convert
 * @returns SHA-256 hash of obj
 */
export function hashObj(obj: unknown): string {
	const canonicalString = canonicalStringify(obj);
	const json = JSON.stringify(canonicalString);
	return hash(json);
}

/**
 * Standardize input before hashing
 * @param input - What needs to be normalized
 * @returns Normalized version of input
 */
function canonicalStringify(input: any): string {
	const str = JSON.stringify(input, Object.keys(input).sort());
	const normalizedStr = str.replace(/\s+/g, ""); // Remove spaces
	return normalizedStr;
}

/* ---------- */
/* --- UI --- */
/* ---------- */
export function initIcon(
	btn: HTMLElement | null,
	icon: string = "",
	tooltip: string = "",
	tooltipOptions?: TooltipOptions
) {
	if (btn) {
		setIcon(btn, icon);
		setTooltip(btn, tooltip, tooltipOptions);
	}
}

/* ------------- */
/* --- DEBUG --- */
/* ------------- */

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

/* ------------- */
/* --- OTHER --- */
/* ------------- */

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
