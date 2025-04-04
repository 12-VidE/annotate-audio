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
import {
	pausePlayer,
	playPlayer,
	setPlayerPosition,
	togglePlayer,
} from "./Logic/playerFunc";
import { retriveDuration, logRefs } from "./sharedFunc";
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

	// Read file from vault
	const file = props.obsidianApp.vault.getAbstractFileByPath(
		props.audioSource
	);
	if (!file || !(file instanceof TFile)) return;
	sharedRefs.srcPath.value = props.obsidianApp.vault.getResourcePath(file);

	// Get duration
	sharedRefs.maxDuration.value = await retriveDuration(
		sharedRefs.srcPath.value
	);

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
	document.addEventListener("pause-other-players", eventPauseOtherPlayers);
	document.addEventListener("pause-audiobox", eventPausePlayer);
	document.addEventListener("play-audiobox", eventPlayPlayer);
	document.addEventListener("toggle-audiobox", eventTogglePlayer);
	document.addEventListener("audiobox-forward", eventForwardPlayer);
	document.addEventListener("audiobox-backward", eventBackwardPlayer);

	/* logRefs(sharedRefs); */
});

onBeforeUnmount(() => {
	pausePlayer(
		props.player,
		props.audioSource,
		options.chunk,
		sharedRefs.currentTime
	);
	saveCache();

	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);
	document.removeEventListener("pause-other-players", eventPauseOtherPlayers);
	document.removeEventListener("pause-audiobox", eventPausePlayer);
	document.removeEventListener("play-audiobox", eventPlayPlayer);
	document.removeEventListener("toggle-audiobox", eventTogglePlayer);
	document.removeEventListener("audiobox-forward", eventForwardPlayer);
	document.removeEventListener("audiobox-backward", eventBackwardPlayer);
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
		const optionsCache = localStorage.getItem(
			`aa_${props.audioSource}_options`
		);
		Object.assign(options, JSON.parse(optionsCache!));
	} else {
		// Cached options CANNOT be used
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
	if (!options.loop)
		pausePlayer(
			props.player,
			props.audioSource,
			options.chunk,
			sharedRefs.currentTime
		);
}

const eventPauseOtherPlayers = (e: Event) => {
	const event = e as CustomEvent;
	// Pause every player, excluding the one that gave the initial comand
	if (event.detail?.id !== props.audioSource) {
		pausePlayer(
			props.player,
			props.audioSource,
			options.chunk,
			sharedRefs.currentTime
		);
	}
};

const eventPausePlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Pause this player
	if (event.detail?.id == props.audioSource) {
		pausePlayer(
			props.player,
			props.audioSource,
			options.chunk,
			sharedRefs.currentTime
		);
	}
};

const eventPlayPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Play this player
	if (event.detail?.id == props.audioSource) {
		playPlayer(
			props.player,
			props.audioSource,
			options.chunk,
			sharedRefs.currentTime.value
		);
	}
};

const eventTogglePlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Toggle this player
	if (event.detail?.id == props.audioSource) {
		togglePlayer(
			props.player,
			props.audioSource,
			options.chunk,
			sharedRefs.currentTime
		);
	}
};

const eventForwardPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Forward this player
	if (event.detail?.id == props.audioSource) {
		setPlayerPosition(
			props.player,
			options.chunk,
			sharedRefs.currentTime,
			sharedRefs.currentTime.value + 5
		);
	}
};

const eventBackwardPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Backward this player
	if (event.detail?.id == props.audioSource) {
		setPlayerPosition(
			props.player,
			options.chunk,
			sharedRefs.currentTime,
			sharedRefs.currentTime.value - 5
		);
	}
};
</script>
