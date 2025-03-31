// Import -Type
import type { Layout } from "./types";
// Import - Component
import LayoutDefault from "./components/Layout/LayoutDefault.vue";
import LayoutBig from "./components/Layout/LayoutBig.vue";

/**
 * Audio extensions supported BY the plugin
 */
export const allowedAudioExtension = [
	"mp3",
	"wav",
	"ogg",
	"flac",
	"mp4",
	"m4a",
	"webm",
];

/**
 * List of all possible layouts
 */
// WARNING: Ignore IDE error on this Array
export const layoutsArray: Array<Layout> = [
	{ name: "Default", component: LayoutDefault },
	{ name: "Big", component: LayoutBig },
];
