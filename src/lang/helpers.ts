import { moment } from "obsidian";
// Import - Language
import en from "./locale/en";
import it from "./locale/it";

const localeMap: { [k: string]: Partial<typeof en> } = {
	en,
	it,
};

const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en): string {
	if (!locale)
		console.error(
			"Error: annonate-audio locale not found",
			moment.locale()
		);

	return (locale && locale[str]) || en[str];
}
