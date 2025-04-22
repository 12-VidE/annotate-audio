<template>
	<!-- Dynamic Layout -->
	<component
		:is="currentLayoutComponent"
		:id="id"
		:source="source"
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
import { layoutsArray } from "../layout/layoutType";
// Import - Function
import { getLayoutOption, getAudioboxOptions } from "./Logic/codeblockFunc";
import { hashObj } from "src/utils";
import {
	pausePlayer,
	playPlayer,
	setPlayerPosition,
	togglePlayer,
} from "../playerLogic";
import { retriveDuration } from "src/utils";
// Import/Create - Ref
import { createShareRefs } from "./sharedRefs";
const sharedRefs = createShareRefs();
import { createOptions } from "src/options";
let options = createOptions();

const props = defineProps<{
	id: string;
	source: string;
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
	if (props.player) props.player.addEventListener("ended", eventEndedAudio);
	document.addEventListener("pause-other-players", eventPauseOtherPlayers);
	// Initialize Event-Listeners - Obsidian Commands
	document.addEventListener("pause-audiobox", eventPausePlayer);
	document.addEventListener("play-audiobox", eventPlayPlayer);
	document.addEventListener("toggle-audiobox", eventTogglePlayer);
	document.addEventListener("audiobox-forward", eventForwardPlayer);
	document.addEventListener("audiobox-backward", eventBackwardPlayer);
});

onBeforeUnmount(() => {
	saveCache();

	pausePlayer(props.player, sharedRefs.currentTime);

	// Destroy Event-Listeners
	props.player.removeEventListener("ended", eventEndedAudio);
	document.removeEventListener("pause-other-players", eventPauseOtherPlayers);
	// Destroy Event-Listeners - Obsidian Commands
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
	const layoutIndex: number = getLayoutOption(props.source);
	return layoutsArray[layoutIndex].component;
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function loadCacheOrFallback(): Promise<void> {
	const codeblockSettings = getAudioboxOptions(
		props.source,
		sharedRefs.maxDuration.value!
	);
	const newHash = await hashObj(codeblockSettings);
	const oldHash = localStorage.getItem(`aa_${props.id}_optionsHash`);

	if (newHash === oldHash) {
		// Cached options CAN be used
		const optionsCache = localStorage.getItem(`aa_${props.id}_options`);
		Object.assign(options, JSON.parse(optionsCache!));
	} else {
		// Cached options CANNOT be used
		Object.assign(options, codeblockSettings);
	}

	// Set time + Resume
	const currentTimeCache = Number(
		localStorage.getItem(`aa_${props.id}_currentTime`)
	);
	if (
		currentTimeCache >= options.chunk.startTime &&
		currentTimeCache <= options.chunk.endTime
	) {
		// Inside chunk - Safe to use cache
		sharedRefs.currentTime.value = currentTimeCache;
		// Resume audio
		const resumeCache: boolean =
			localStorage.getItem(`aa_${props.id}_resume`) === "true";
		if (resumeCache)
			playPlayer(
				props.id,
				props.player,
				options.chunk,
				sharedRefs.currentTime.value
			);
	}

	// Out-of-bounadry - Fall back to safe place
	else sharedRefs.currentTime.value = options.chunk?.startTime!;
}

async function saveCache(): Promise<void> {
	localStorage.setItem(`aa_${props.id}_optionsHash`, await hashObj(options));
	localStorage.setItem(`aa_${props.id}_options`, JSON.stringify(options));
	localStorage.setItem(
		`aa_${props.id}_currentTime`,
		JSON.stringify(props.player.currentTime)
	);
	localStorage.setItem(
		`aa_${props.id}_resume`,
		JSON.stringify(sharedRefs.resume.value)
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
	if (!options.loop) pausePlayer(props.player, sharedRefs.currentTime);
}

const eventPauseOtherPlayers = (e: Event) => {
	const event = e as CustomEvent;
	// Pause every player, excluding the one that gave the initial comand
	if (event.detail?.id !== props.id) {
		pausePlayer(props.player, sharedRefs.currentTime);
	}
};

const eventPausePlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Pause this player
	if (event.detail?.id == props.id) {
		pausePlayer(props.player, sharedRefs.currentTime);
	}
};

const eventPlayPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Play this player
	if (event.detail?.id == props.id) {
		playPlayer(
			props.id,
			props.player,
			options.chunk,
			sharedRefs.currentTime.value
		);
	}
};

const eventTogglePlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Toggle this player
	if (event.detail?.id == props.id) {
		togglePlayer(
			props.id,
			props.player,
			options.chunk,
			sharedRefs.currentTime
		);
	}
};

const eventForwardPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Forward this player
	if (event.detail?.id == props.id) {
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
	if (event.detail?.id == props.id) {
		setPlayerPosition(
			props.player,
			options.chunk,
			sharedRefs.currentTime,
			sharedRefs.currentTime.value - 5
		);
	}
};
</script>
