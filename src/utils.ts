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

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export function hashCode(str: string) {
	let hash = 0;
	for (let i = 0, len = str.length; i < len; i++) {
		const chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}
