import { moment } from "obsidian";
// Import - Language
import en from "./locale/en";
import it from "./locale/it";
import zhCN from "./locale/zh-cn";
import es from "./locale/es";
import ptBR from "./locale/pt-br";

const localeMap: { [k: string]: Partial<typeof en> } = {
	en,
	it,
	"zh-cn": zhCN,
	es,
	"pt-br": ptBR,
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
