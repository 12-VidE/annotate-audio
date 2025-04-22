import { setIcon, setTooltip, TooltipOptions } from "obsidian";
import { isRef } from "vue";

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
 * Converts ss into HH:mm:ss OR mm:ss
 * @param num - Input to convert
 * @param max - WHEN present, num is removed of the extra hour padding
 * @returns {string}
 */
export function secondsToTime(num: number, max?: number): string {
	num = Math.floor(num);
	const HH = String(Math.floor(num / 3600)).padStart(2, "0");
	const mm = String(Math.floor((num % 3600) / 60)).padStart(2, "0");
	const ss = String(num % 60).padStart(2, "0");

	// Output depends on the presence of max
	if (max !== undefined && max < 3600) return `${mm}:${ss}`;
	else return `${HH}:${mm}:${ss}`;
}

/* ------------ */
/* --- Hash --- */
/* ------------ */

/**
 * @param obj - Input to convert
 * @returns SHA-256 hash of obj
 */
export async function hashObj(obj: object): Promise<string> {
	const str = JSON.stringify(obj); // Force it into a string
	return await hashStr(str);
}

/**
 * @param str - Input to convert
 * @returns SHA-256 hash of str
 */
export async function hashStr(str: string): Promise<string> {
	// Normalize
	const normStr = canonicalStringify(str);
	// Endoce
	const encoder = new TextEncoder();
	const data = encoder.encode(normStr);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hash = Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hash;
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
