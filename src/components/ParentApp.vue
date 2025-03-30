<template>
	<!-- Dynamic Layout -->
	<component
		:is="currentLayoutComponent"
		:container="container"
		:ctx="ctx"
		:audioSource="audioSource"
		:player="player"
		:obsidianApp="obsidianApp"
		:sharedRefs="sharedRefs"
		:options="options"
	/>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
import { computed, onMounted, onBeforeMount, onBeforeUnmount } from "vue";
// Import - Components
import { layoutsArray } from "src/const";
// Import - Function
import {
	getStickySetting,
	getChunkSetting,
	getLayoutSetting,
	getAutoplaySetting,
	getAudioboxOptions,
} from "./Logic/codeblockFunc";
import { hashObj, hashStr } from "src/utils";
import { pausePlayer, setPlayerPosition } from "./Logic/playerFunc";
import { logRefs } from "./sharedFunc";
// Import/Create - Ref
import { createShareRefs } from "./sharedRefs";
const sharedRefs = createShareRefs();
import { AudioBoxOptions, createOptionRefs } from "src/options";
let options = createOptionRefs();

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onBeforeMount(async () => {
	console.log("onBeforeMount");
	// Nothing...
});

onMounted(async () => {
	console.log("Mounted");

	await tryLoadCache();
	console.time("loadFile");
	await loadFile();
	console.timeEnd("loadFile");

	// Get some default values
	options.sticky = getStickySetting(props.ctx, props.container);
	options.autoplay = getAutoplaySetting(props.ctx, props.container);
	props.player.src = sharedRefs.srcPath.value;
	props.player.currentTime = sharedRefs.currentTime.value;

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("ended", eventEndedAudio);
	}

	/* logRefs(sharedRefs); */
});

onBeforeUnmount(() => {
	console.log("unmounted");
	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);

	pausePlayer(
		props.ctx,
		props.container,
		props.player,
		options.chunk,
		sharedRefs.currentTime
	);

	saveCache();
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * Select which player layout to display
 */
const currentLayoutComponent = computed(() => {
	const layoutIndex: number = getLayoutSetting(props.ctx, props.container);
	return layoutsArray[layoutIndex].component;
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function loadFile(): Promise<AudioBuffer | undefined> {
	try {
		// Read file from vault
		const file = props.obsidianApp.vault.getAbstractFileByPath(
			props.audioSource
		);
		if (!file || !(file instanceof TFile)) return;

		const arrBuf = await props.obsidianApp.vault.adapter.readBinary(
			file.path
		);
		const audioContext = new AudioContext();

		const buf = await audioContext.decodeAudioData(arrBuf);
		// Save infos
		sharedRefs.maxDuration.value = Math.floor(buf.duration);
		sharedRefs.srcPath.value =
			props.obsidianApp.vault.getResourcePath(file);
		return buf;
	} catch (error) {
		console.error("loadFile → ", error);
	}
	return;
}

async function tryLoadCache(): Promise<void> {
	// Get new options in block
	const codeblockSettings = await getAudioboxOptions(
		props.ctx,
		props.container
	);
	const newHash = await hashObj(codeblockSettings);
	const oldHash = localStorage.getItem("optionsHash");

	if (newHash === oldHash) {
		// Cache CAN be used
		const optionsCache = localStorage.getItem("optionsCache");
		Object.assign(options, JSON.parse(optionsCache!));
		const currentTimeCache = localStorage.getItem("optionsCurrentTime");
		sharedRefs.currentTime.value = Number(currentTimeCache);
	} else {
		// Cache CANNOT be used
		options = codeblockSettings;
		console.log("⚠️");
		// (Force) Set time otherwise may be out-of-boundary
		sharedRefs.currentTime.value = options.chunk?.startTime!;
	}

	/* 
		// Initialize chunk OR use "default"
		const newChunk = await getChunkSetting(props.ctx, props.container);
		sharedRefs.chunk.value = newChunk || {
			startTime: 0,
			endTime: sharedRefs.maxDuration.value,
			duration: sharedRefs.maxDuration.value,
		};*/
}

async function saveCache(): Promise<void> {
	localStorage.setItem("optionsHash", await hashObj(options));
	localStorage.setItem("optionsCache", JSON.stringify(options));
	localStorage.setItem(
		"optionsCurrentTime",
		JSON.stringify(props.player.currentTime)
	);
}

/* ------------------------- */
/* --- Function ON Event --- */

function eventEndedAudio() {
	setPlayerPosition(
		props.player,
		options.chunk,
		sharedRefs.currentTime,
		options.chunk?.startTime!
	);
	if (!props.player.loop)
		pausePlayer(
			props.ctx,
			props.container,
			props.player,
			options.chunk,
			sharedRefs.currentTime
		);
}
</script>
