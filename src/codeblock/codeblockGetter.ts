/* 	##############
	▼▼ STANDARD functions to get info FROM codeblock
	#############  */

/**
 * Find matching-groups inside code-block, line-by-line
 * @param source Codeblock content
 * @param regex Regex w/ 1+ matching group to apply inside code-block
 * @returns What's inside matching group. Each line may for an array IF there are 2+ matching groups
 */
export const getCodeblockData = (
	source: string,
	regex: RegExp = /^.*$/
): Array<string | string[]> => {
	const codeblockLines = source.split("\n");
	if (codeblockLines)
		return codeblockLines
			.map((line: string) => {
				const match = regex.exec(line);
				if (match) {
					if (match.length === 2)
						// Only one capturing group → return it directly
						return match[1];
					else if (match.length > 2)
						// More than one capturing group → return an array
						return match.slice(1);
					// No capturing groups → return full match
					else return match[0];
				}
				// Fallback
				return null;
			})
			.filter(
				(result: any): result is string | string[] => result !== null
			);
	else return [""];
};
