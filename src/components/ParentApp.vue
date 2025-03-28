<template>
	<!-- Dynamic Layout -->
	<KeepAlive>
		<component
			:is="currentLayoutComponent"
			:container="container"
			:ctx="ctx"
			:audioSource="audioSource"
			:player="player"
			:obsidianApp="obsidianApp"
			:sharedRefs="sharedRefs"
		/>
	</KeepAlive>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
import {
	computed,
	onMounted,
	onBeforeMount,
	onBeforeUnmount,
	KeepAlive,
} from "vue";
// Import - Components
import { layoutsArray } from "src/const";
// Import - Function
import {
	getStickySetting,
	getChunkSetting,
	getLayoutSetting,
	getAutoplaySetting,
} from "./Logic/codeblockFunc";
import { pausePlayer, setPlayerPosition } from "./Logic/playerFunc";
import { logRefs } from "./sharedFunc";
// Import/Create - Ref
import { createShareRefs } from "./sharedRefs";
const sharedRefs = createShareRefs();

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

onBeforeMount(async () => {
	console.log("onBeforeMount");
	await loadFile();

	// Get some default values
	sharedRefs.isSticky.value = getStickySetting(props.ctx, props.container);
	sharedRefs.isAutoplay.value = getAutoplaySetting(
		props.ctx,
		props.container
	);
});

onMounted(() => {
	console.log("Mounted");
	props.player.src = sharedRefs.srcPath.value;

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("ended", eventEndedAudio);
	}

	logRefs(sharedRefs);

	if (props.player.src === sharedRefs.srcPath.value) {
		console.log("inside");
		props.player.currentTime = sharedRefs.currentTime.value;
	}
});

onBeforeUnmount(() => {
	console.log("unmounted");
	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);

	pausePlayer(
		props.ctx,
		props.container,
		props.player,
		sharedRefs.chunk.value,
		sharedRefs.currentTime
	);

	/* 	if (sharedRefs.isCached) {
		// IF we are sure nothing major has changed, everything is already
		localStorage.setItem(
			`${props.audioSource}_goodCache`,
			JSON.stringify(true)
		); 
	} else {
        // IF smt major has changed, update chache
    }
	// Save cache to make sure you have to most up-to-date info
	localStorage[`${props.audioSource}_currentTime`] = JSON.stringify(
		sharedRefs.currentTime.value
	);
	localStorage[`${props.audioSource}_currentTime`] = JSON.stringify(
		sharedRefs.currentTime.value
	);
	localStorage[`${props.audioSource}_currentTime`] = JSON.stringify(
		sharedRefs.currentTime.value
	); */
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

async function loadFile(): Promise<void> {
	console.time("loadFile");
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
		/* console.time("decodeAudio"); */
		const buf = await audioContext.decodeAudioData(arrBuf);
		/* console.timeEnd("decodeAudio"); */
		sharedRefs.totalDuration.value = Math.floor(buf.duration);
		sharedRefs.srcPath.value =
			props.obsidianApp.vault.getResourcePath(file);

		if (
			JSON.parse(
				localStorage.getItem(`${props.audioSource}_goodCache`) ||
					"false"
			)
		) {
			// CAN relay on cache CAUSE key things have NOT changed
			console.log("isCached");
			sharedRefs.isCached.value = true; // Save state
			// Retrive values
			sharedRefs.chunk.value = JSON.parse(
				localStorage[`${props.audioSource}_chunk`]
			);
			sharedRefs.currentTime.value = JSON.parse(
				localStorage[`${props.audioSource}_currentTime`]
			);
		} else {
			// CANNOT relay on cache CAUSE there have been major changes
			sharedRefs.isCached.value = false; // Save state
			// Initialize chunk OR use "default"
			const newChunk = await getChunkSetting(props.ctx, props.container);
			sharedRefs.chunk.value = newChunk || {
				startTime: 0,
				endTime: sharedRefs.totalDuration.value,
				duration: sharedRefs.totalDuration.value,
			};
			localStorage[`${props.audioSource}_chunk`] = JSON.stringify(
				sharedRefs.chunk.value
			);
			// (Force) Set time otherwise may be out-of-boundary
			sharedRefs.currentTime.value = sharedRefs.chunk.value?.startTime!;
			// Reset cache flag
		}
		props.player.currentTime = sharedRefs.currentTime.value;
	} catch (error) {
		console.error("loadFile → ", error);
	}
	console.timeEnd("loadFile");
}

function eventEndedAudio() {
	setPlayerPosition(
		props.player,
		sharedRefs.chunk.value,
		sharedRefs.currentTime,
		sharedRefs.chunk.value?.startTime!
	);
	if (!props.player.loop)
		pausePlayer(
			props.ctx,
			props.container,
			props.player,
			sharedRefs.chunk.value,
			sharedRefs.currentTime
		);
}
</script>
