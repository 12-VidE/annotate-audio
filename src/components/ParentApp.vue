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
import { computed, onMounted, onBeforeUnmount } from "vue";
// Import - Components
import { layoutsArray } from "src/const";
// Import - Function
import { getLayoutOption, getAudioboxOptions } from "./Logic/codeblockFunc";
import { hashObj } from "src/utils";
import { pausePlayer, setPlayerPosition } from "./Logic/playerFunc";
import { logRefs } from "./sharedFunc";
// Import/Create - Ref
import { createShareRefs } from "./sharedRefs";
const sharedRefs = createShareRefs();
import { createOptions } from "src/options";
let options = createOptions();

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

onMounted(async () => {
	await loadCacheOrFallback();
	console.time("loadFile");
	await loadFile();
	console.timeEnd("loadFile");
	// Initialize Player
	props.player.src = sharedRefs.srcPath.value;
	props.player.currentTime = sharedRefs.currentTime.value;
	props.player.volume = options.volume;
	props.player.playbackRate = options.speed;
	props.player.loop = options.loop;

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("ended", eventEndedAudio);
	}

	/* logRefs(sharedRefs); */
});

onBeforeUnmount(() => {
	pausePlayer(props.player, options.chunk, sharedRefs.currentTime);
	saveCache();

	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * Select which player layout to display
 */
const currentLayoutComponent = computed(() => {
	const layoutIndex: number = getLayoutOption(props.ctx, props.container);
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

async function loadCacheOrFallback(): Promise<void> {
	const codeblockSettings = getAudioboxOptions(
		props.ctx,
		props.container,
		sharedRefs.maxDuration.value!
	);
	const newHash = await hashObj(codeblockSettings);
	const oldHash = localStorage.getItem(`aa_${props.audioSource}_optionsHash`);

	if (newHash === oldHash) {
		// Cached options CAN be used
		console.log("✔️");
		const optionsCache = localStorage.getItem(
			`aa_${props.audioSource}_options`
		);
		Object.assign(options, JSON.parse(optionsCache!));
	} else {
		// Cached options CANNOT be used
		console.log("❌");
		Object.assign(options, codeblockSettings);
	}

	// Set time
	const currentTimeCache = Number(
		localStorage.getItem(`aa_${props.audioSource}_currentTime`)
	);
	if (
		currentTimeCache >= options.chunk.startTime &&
		currentTimeCache <= options.chunk.endTime
	)
		// Inside chunk - Safe to use cache
		sharedRefs.currentTime.value = currentTimeCache;
	// Out-of-bounadry - Fall back to safe place
	else sharedRefs.currentTime.value = options.chunk?.startTime!;
}

async function saveCache(): Promise<void> {
	localStorage.setItem(
		`aa_${props.audioSource}_optionsHash`,
		await hashObj(options)
	);
	localStorage.setItem(
		`aa_${props.audioSource}_options`,
		JSON.stringify(options)
	);
	localStorage.setItem(
		`aa_${props.audioSource}_currentTime`,
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
		pausePlayer(props.player, options.chunk, sharedRefs.currentTime);
}
</script>
