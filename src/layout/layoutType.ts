import { ComponentOptions, ComponentProvideOptions } from "vue";
// Import - Component
import LayoutDefault from "./LayoutDefault.vue";
import LayoutBig from "./LayoutBig.vue";
import LayoutGeek from "./LayoutGeek.vue";
// Import - Function
import { t } from "src/lang/helpers";

export type Layout = {
	name: string;
	component: ComponentOptions<
		{},
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		string,
		{},
		{},
		string,
		{},
		{},
		{},
		string,
		ComponentProvideOptions
	>;
};

/**
 * List of all possible layouts
 * WARNING - Ignore IDE error
 */
export const layoutsArray: Array<Layout> = [
	{ name: t("DEFAUTL_LAYOUT_NAME"), component: LayoutDefault },
	{ name: t("BIG_LAYOUT_NAME"), component: LayoutBig },
	{ name: t("GEEK_LAYOUT_NAME"), component: LayoutGeek },
];
