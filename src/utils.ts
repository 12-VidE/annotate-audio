import { setIcon, setTooltip, TooltipOptions } from "obsidian";
import { isRef } from "vue";
import { hash } from "spark-md5";

/* ------------------ */
/* --- Conversion --- */
/* ------------------ */

/**
 * Converts time (HH:MM:SS.sss, MM:SS.sss) into SS.ss
 * @param {string} time
 * @returns {number}
 */
export function timeToSeconds(time: string): number {
	const parts = time.split(":").map(Number).reverse();

	let seconds: number = 0;
	if (parts[0]) seconds += parts[0]; // Seconds (can include decimals)
	if (parts[1]) seconds += parts[1] * 60; // Minutes
	if (parts[2]) seconds += parts[2] * 3600; // Hours

	return Number(seconds.toFixed(2));
}

/**
 * Converts time (HH:MM:SS.sss, MM:SS.sss) into LRC format MM:SS.ss
 * @param {string} time
 * @returns {number}
 */
export function secondToLRCTime(num: number): string {
	const numFloor: number = Math.trunc(num);
	let ss: string = String(numFloor % 60).padStart(2, "0");
	let mm: string = String(Math.floor(numFloor / 60)).padStart(2, "0");
	// Decimals
	let ms: string = String(Math.floor(Math.abs(num - numFloor) * 100)).padEnd(
		2,
		"0"
	);

	return `${mm}:${ss}.${ms}`;
}

/**
 * Converts ss into HH:mm:ss.ms OR as short as possible
 * @param num - Input to convert
 * @param nDecimals - How many decimals to show
 * @param max - WHEN present, num is strip down to fit "max" format
 * @returns {string}
 */
export function secondsToTime(
	num: number,
	nDecimals: number = 0,
	max?: number
): string {
	let time: string = "";

	const numFloor: number = Math.floor(num);

	if (max && max > 0 && max < 60) {
		// ss.ms OR s.ms
		let ss: string = String(numFloor % 60);
		if (max >= 10) ss = ss.padStart(2, "0");
		time = `${ss}`;
	} else if (max && max < 360) {
		// mm:ss.ms OR m:ss.ms
		const ss: string = String(numFloor % 60).padStart(2, "0");
		let mm: string = String(Math.floor((numFloor % 3600) / 60));
		if (max >= 600) mm = mm.padStart(2, "0");
		time = `${mm}:${ss}`;
	} else {
		// HH:mm:ss.ms OR H:mm:ss.ms
		const ss: string = String(numFloor % 60).padStart(2, "0");
		const mm: string = String(Math.floor((numFloor % 3600) / 60)).padStart(
			2,
			"0"
		);
		let HH: string = String(Math.floor(numFloor / 3600));
		if (!max || max >= 36000) HH = HH.padStart(2, "0");
		time = `${HH}:${mm}:${ss}`;
	}
	// Add ms IF needed
	if (nDecimals > 0) {
		let selectedDecimals: string = "0".repeat(nDecimals);
		const allDecimals = String(num).split(".")[1];
		if (allDecimals)
			selectedDecimals = allDecimals
				.slice(0, nDecimals)
				.padEnd(nDecimals, "0");
		time = time.concat(`.${selectedDecimals}`);
	}
	return time;
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

/**
 * (Magic ChatGPT) Performe action WHEN obj is updated w/o breaking reactivity (i think)
 * @param obj
 * @param key
 * @param onChange
 */
export function watchProperty<T extends object, K extends keyof T>(
	obj: T,
	key: K,
	onChange: (newVal: T[K], oldVal: T[K]) => void
) {
	let val = obj[key];
	Object.defineProperty(obj, key, {
		get: () => val,
		set: (newVal) => {
			const oldVal = val;
			val = newVal;
			onChange(newVal, oldVal);
		},
		configurable: true,
	});
}
