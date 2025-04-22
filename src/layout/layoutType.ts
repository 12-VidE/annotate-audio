import { ComponentOptions, ComponentProvideOptions } from "vue";
// Import - Component
import LayoutDefault from "./LayoutDefault.vue";
import LayoutBig from "./LayoutBig.vue";
import LayoutGeek from "./LayoutGeek.vue";

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
	{ name: "Default", component: LayoutDefault },
	{ name: "Big", component: LayoutBig },
	{ name: "Geek", component: LayoutGeek },
];
