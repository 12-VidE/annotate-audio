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
		v-model:sharedRefs="sharedRefs"
		v-model:options="options"
		v-model:comments="comments"
	/>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
import { computed, onMounted, onBeforeUnmount } from "vue";
// Import - Components
import { layoutsArray } from "./layout/layoutType";
// Import - Type
import type { SharedRefs } from "./types";
import type { AudioBoxOptions } from "src/options/optionsType";
// Import - Function
import { getAudioboxOptions } from "src/options/optionsGetter";
import {
	pausePlayer,
	playPlayer,
	setPlayerPosition,
	togglePlayer,
} from "./playerLogic";
import { hashObj, retriveDuration } from "src/utils";
import { AudioComment } from "./comment/commentType";

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

const sharedRefs = defineModel<SharedRefs>("sharedRefs", { required: true });
const options = defineModel<AudioBoxOptions>("options", { required: true });
const comments = defineModel<AudioComment[]>("comments", {
	required: true,
});

onMounted(async () => {
	await loadCacheOrFallback();

	// Read file from vault
	const file = props.obsidianApp.vault.getAbstractFileByPath(
		props.audioSource
	);
	if (!file || !(file instanceof TFile)) return;
	sharedRefs.value.srcPath = props.obsidianApp.vault.getResourcePath(file);

	// Get duration
	sharedRefs.value.maxDuration = await retriveDuration(
		sharedRefs.value.srcPath
	);

	// Initialize Player
	props.player.src = sharedRefs.value.srcPath;
	props.player.currentTime = sharedRefs.value.currentTime;
	props.player.volume = options.value.volume;
	props.player.playbackRate = options.value.speed;
	props.player.loop = options.value.loop;

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
	/* saveCache(); */

	pausePlayer(props.player, sharedRefs.value.currentTime);

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
	return layoutsArray[options.value.layout].component;
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function loadCacheOrFallback(): Promise<void> {
	const codeblockSettings = getAudioboxOptions(
		props.source,
		sharedRefs.value.maxDuration
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
		currentTimeCache >= options.value.chunk.startTime &&
		currentTimeCache <= options.value.chunk.endTime
	) {
		// Inside chunk - Safe to use cache
		sharedRefs.value.currentTime = currentTimeCache;
		// Resume audio
		const resumeCache: boolean =
			localStorage.getItem(`aa_${props.id}_resume`) === "true";
		if (resumeCache)
			playPlayer(
				props.id,
				props.player,
				options.value.chunk,
				sharedRefs.value.currentTime
			);
	}

	// Out-of-bounadry - Fall back to safe place
	else sharedRefs.value.currentTime = options.value.chunk?.startTime!;
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
		JSON.stringify(sharedRefs.value.resume)
	);
}

/* ------------------------- */
/* --- Function ON Event --- */

function eventEndedAudio() {
	setPlayerPosition(
		props.player,
		options.value.chunk,
		sharedRefs.value.currentTime,
		options.value.chunk?.startTime!
	);
	if (!options.value.loop)
		pausePlayer(props.player, sharedRefs.value.currentTime);
}

const eventPauseOtherPlayers = (e: Event) => {
	const event = e as CustomEvent;
	// Pause every player, excluding the one that gave the initial comand
	if (event.detail?.id !== props.id) {
		pausePlayer(props.player, sharedRefs.value.currentTime);
	}
};

const eventPausePlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Pause this player
	if (event.detail?.id == props.id) {
		pausePlayer(props.player, sharedRefs.value.currentTime);
	}
};

const eventPlayPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Play this player
	if (event.detail?.id == props.id) {
		playPlayer(
			props.id,
			props.player,
			options.value.chunk,
			sharedRefs.value.currentTime
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
			options.value.chunk,
			sharedRefs.value.currentTime
		);
	}
};

const eventForwardPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Forward this player
	if (event.detail?.id == props.id) {
		setPlayerPosition(
			props.player,
			options.value.chunk,
			sharedRefs.value.currentTime,
			sharedRefs.value.currentTime + 5
		);
	}
};

const eventBackwardPlayer = (e: Event) => {
	const event = e as CustomEvent;
	// Backward this player
	if (event.detail?.id == props.id) {
		setPlayerPosition(
			props.player,
			options.value.chunk,
			sharedRefs.value.currentTime,
			sharedRefs.value.currentTime - 5
		);
	}
};
</script>
