/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * @returns title to be displayed (return false IF no title needs to be shown)
 */
export function displayTitle(
	source: string,
	title: string | undefined
): false | string {
	if (title === undefined) {
		// Show nothing IF there's no 'title' option
		return false;
	} else if (title === "") {
		// Use source (cleaning extension)
		return source!.replace(/\.[^/.]+$/, "");
	}
	// Return 'title' option IF specified
	return title;
}
