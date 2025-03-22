<template>
	<div class="audiobox" tabindex="0">
		<!-- Dynamic Layout -->
		<component
			:is="currentLayoutComponent"
			:container="container"
			:ctx="ctx"
			:audioSource="audioSource"
			:player="player"
			:obsidianApp="obsidianApp"
		/>
	</div>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
import { computed, onMounted, onBeforeMount, onBeforeUnmount } from "vue";
// Import - Components
import LayoutMiminal from "./Layout/LayoutMinimal.vue";
import LayoutDefault from "./Layout/LayoutDefault.vue";
// Import - Function
import {
	getStickySetting,
	getChunkSetting,
	getLayoutSetting,
} from "./Logic/codeblockFunc";
import { pausePlayer, setPlayerPosition } from "./Logic/playerFunc";
// Import - Ref
import { srcPath, chunk, currentTime, isSticky, isCached } from "./sharedRefs";

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

onBeforeMount(async () => {
	await loadFile();

	// Get some default values
	isSticky.value = getStickySetting(props.ctx, props.container);
});

onMounted(async () => {
	props.player.src = srcPath.value;

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("ended", eventEndedAudio);
	}
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);

	pausePlayer(props.ctx, props.container, props.player);
	props.player.src = ""; // "Destroy" player
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * Select which player layout to display
 */
const currentLayoutComponent = computed(() => {
	const layoutList = [LayoutDefault, LayoutMiminal];
	const layoutIndex: number = getLayoutSetting(props.ctx, props.container);
	return layoutList[layoutIndex - 1];
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function loadFile(): Promise<void> {
	try {
		// Read file from vault
		const file = props.obsidianApp.vault.getAbstractFileByPath(
			props.audioSource
		);
		if (!file || !(file instanceof TFile)) return;

		srcPath.value = props.obsidianApp.vault.getResourcePath(file);
		const arrBuf = await props.obsidianApp.vault.adapter.readBinary(
			file.path
		);
		const audioContext = new AudioContext();
		const buf = await audioContext.decodeAudioData(arrBuf);

		const chunkOption = await getChunkSetting(props.ctx, props.container);
		if (
			JSON.stringify(chunkOption) !==
			localStorage[`${props.audioSource}_chunk`]
		) {
			// Initialize chunk IF it has changed
			chunk.value = chunkOption || {
				startTime: 0,
				endTime: Math.floor(buf.duration),
				duration: Math.floor(buf.duration),
			};
			isCached.value = false;
			localStorage[`${props.audioSource}_chunk`] = JSON.stringify(
				chunk.value
			);
			// (Force) Set time otherwise may be out-of-boundary
			currentTime.value = chunk.value?.startTime!;
			props.player.currentTime = currentTime.value;
		} else {
			isCached.value = true;
			chunk.value = JSON.parse(
				localStorage[`${props.audioSource}_chunk`]
			);
		}
	} catch (error) {
		console.error("loadFile → ", error);
	}
}

function eventEndedAudio() {
	setPlayerPosition(props.player, chunk.value?.startTime!);
	if (!props.player.loop)
		pausePlayer(props.ctx, props.container, props.player);
}
</script>
