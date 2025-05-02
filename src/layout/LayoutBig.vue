<template>
	<div class="layout--big">
		<!-- Title -->
		<div v-show="title" :class="['audiobox-title']">
			<span ref="titleIcon"></span>
			{{ title }}
		</div>
		<!-- WaveGraph -->
		<div
			:class="['wavegraph', sharedRefs.isCommentInputShown && 'disabled']"
		>
			<div
				v-for="(s, i) in barHeights"
				:class="{ bar: true, playedBar: i <= currentBar }"
				:key="id + i"
				:style="{ height: s * 6 + 'rem' }"
			></div>
		</div>
		<div
			ref="stickyContainer"
			:class="['main-container', options.sticky && 'is-sticky']"
		>
			<!-- Timeline -->
			<div
				:class="[
					'timeline-container',
					sharedRefs.isCommentInputShown && 'disabled',
				]"
			>
				<input
					type="range"
					:min="options.chunk?.startTime"
					:max="options.chunk?.endTime"
					step="0.1"
					v-model="sharedRefs.currentTime"
					@input="eventTimeBarInput"
				/>
				<div :class="['timeline-numbers']">
					<span>{{ displayCurrentTime }}</span>
					<span>{{ displayDuration }}</span>
				</div>
			</div>
			<!-- Controls -->
			<div :class="['controls-container']">
				<!-- Properies -->
				<button
					type="button"
					ref="showProperties_btn"
					:class="[
						'commentInput_btn',
						'control_btn',
						sharedRefs.isCommentInputShown && 'disabled',
					]"
					@click="
						pausePlayer(player, sharedRefs.currentTime);
						openOptionsModal();
					"
				></button>
				<!-- Backward -->
				<button
					type="button"
					:class="[
						'control_btn',
						'secondary_btn',
						sharedRefs.isCommentInputShown &&
							!options.unstoppable &&
							'disabled',
					]"
					@click="
						setPlayerPosition(
							player,
							options.chunk,
							sharedRefs.currentTime,
							sharedRefs.currentTime - 5
						)
					"
				>
					-5s
				</button>
				<!-- Play/Pause -->
				<button
					type="button"
					ref="playpause_btn"
					:class="[
						'control_btn',
						sharedRefs.isCommentInputShown &&
							!options.unstoppable &&
							'disabled',
					]"
					@click="
						togglePlayer(
							id,
							player,
							options.chunk,
							sharedRefs.currentTime
						)
					"
				></button>
				<!-- Forward -->
				<button
					:class="[
						'control_btn',
						'secondary_btn',
						sharedRefs.isCommentInputShown &&
							!options.unstoppable &&
							'disabled',
					]"
					@click="
						setPlayerPosition(
							player,
							options.chunk,
							sharedRefs.currentTime,
							sharedRefs.currentTime + 5
						)
					"
				>
					+5s
				</button>
				<!-- Add Comment -->
				<button
					ref="showCommentInput_btn"
					:class="[
						'commentInput_btn',
						'control_btn',
						sharedRefs.isCommentInputShown && 'disabled',
					]"
					@click="sharedRefs.isCommentInputShown = true"
				></button>
			</div>
			<!-- Comment Input -->
			<CommentInput
				:id="id"
				:player="player"
				v-model:sharedRefs="sharedRefs"
				v-model:options="options"
				v-model:comments="comments"
			/>
		</div>

		<!-- Comments List -->
		<CommentsList
			:id="id"
			:player="player"
			:obsidianApp="obsidianApp"
			v-model:sharedRefs="sharedRefs"
			v-model:options="options"
			v-model:comments="comments"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { App, TFile } from "obsidian";
// Import - Component
import CommentInput from "../comment/CommentInput.vue";
import CommentsList from "../comment/CommentsList.vue";
// Import - Type
import type { AudioChunk } from "src/types";
import type { SharedRefs } from "src/types";
import type { AudioBoxOptions } from "src/options/optionsType";
import type { AudioComment } from "src/comment/commentType";
// Import - Class
import { optionsModal } from "src/options/optionsModal";
// Import - Functions
import { displayTitle } from "./layoutLogic";
import { togglePlayer, setPlayerPosition, pausePlayer } from "../playerLogic";
import { hashObj, initIcon, secondsToTime } from "src/utils";

const props = defineProps<{
	id: string;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

const sharedRefs = defineModel<SharedRefs>("sharedRefs", { required: true });
const options = defineModel<AudioBoxOptions>("options", { required: true });
const comments = defineModel<AudioComment[]>("comments", {
	required: true,
});

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

// UI
const titleIcon = ref<HTMLElement | null>(null);
const playpause_btn = ref<HTMLElement | null>(null);
const showCommentInput_btn = ref<HTMLElement | null>(null);
const showProperties_btn = ref<HTMLElement | null>(null);
// WaveGraph
const nSamples: number = 150; // N° of bars in WaveGraph
const barHeights = ref<number[]>([]); // Height of the bars of the graph

onMounted(async () => {
	// Initialize icons
	initIcon(titleIcon.value, "audio-lines");
	initIcon(playpause_btn.value, "play");
	initIcon(showCommentInput_btn.value, "bookmark-plus");
	initIcon(showProperties_btn.value, "settings-2");

	// Initialize Wavegraph
	const newHash = await hashObj(options.value);
	const oldHash = localStorage.getItem(`aa_${props.id}_optionsHash`);
	if (newHash === oldHash) {
		const cachedBarHeights = localStorage.getItem(
			`aa_${props.id}_barHeights`
		);
		if (cachedBarHeights) {
			// Use cache
			barHeights.value = JSON.parse(cachedBarHeights);
		} else {
			// Re-Calculate
			barHeights.value = await calculateWaveGraph();
		}
	} else {
		// Re-Calculate
		barHeights.value = await calculateWaveGraph();
	}

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	props.player.removeEventListener("timeupdate", eventTimeUpdate);
	props.player.removeEventListener("play", eventPlayerPlay);
	props.player.removeEventListener("pause", eventPlayerPause);

	saveCache();
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const displayCurrentTime = computed(() =>
	secondsToTime(
		Math.floor(sharedRefs.value.currentTime),
		sharedRefs.value.maxDuration
	)
);

const displayDuration = computed(() =>
	secondsToTime(options.value.chunk.endTime, sharedRefs.value.maxDuration)
);

const currentBar = computed(() => {
	return Math.floor(
		((sharedRefs.value.currentTime - options.value.chunk.startTime) /
			options.value.chunk.duration!) *
			nSamples
	);
});

const title = computed(() =>
	displayTitle(options.value.source, options.value.title)
);

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function calculateWaveGraph(): Promise<number[]> {
	// Read file from vault
	const file = props.obsidianApp.vault.getAbstractFileByPath(
		props.audioSource
	) as TFile;
	// Process audio file & set audio source
	if (file && file instanceof TFile) {
		const arrBuf = await props.obsidianApp.vault.adapter.readBinary(
			file.path
		);
		const audioContext = new AudioContext();
		const tempArray: Array<number> = [];

		audioContext.decodeAudioData(arrBuf, async (buf) => {
			let rawData = buf.getChannelData(0);
			const audioSampleRate = buf.sampleRate;
			const playedChunk: AudioChunk = {
				startTime: Math.floor(
					options.value.chunk.startTime! * audioSampleRate
				),
				endTime: Math.floor(
					options.value.chunk?.endTime! * audioSampleRate
				),
			}; // Portion of audio to play (can be entire file)
			const barWidth = Math.floor(
				(playedChunk.endTime - playedChunk.startTime) / nSamples
			);
			let highestBar = 0;
			for (let i = 0; i < nSamples; i++) {
				let blockStart = options.value.chunk?.startTime! + barWidth * i;
				let sum = 0;
				for (let j = 0; j < barWidth; j++) {
					sum += Math.abs(rawData[blockStart + j]);
				}
				const barHeigth = sum / barWidth;
				tempArray.push(barHeigth);
				// Save highest
				if (barHeigth > highestBar) highestBar = barHeigth;
			}
			// Normalize & save WaveGraph
			return (barHeights.value = tempArray.map((x) => x / highestBar));
		});
	}

	// Default result
	return [];
}

function saveCache(): void {
	localStorage.setItem(
		`aa_${props.id}_barHeights`,
		JSON.stringify(barHeights.value)
	);
}

async function openOptionsModal(): Promise<void> {
	try {
		const modal = new optionsModal(
			options.value,
			props.obsidianApp,
			sharedRefs.value.maxDuration!
		);
		const newOptions = await modal.openPropertiesModal();

		Object.assign(options.value, newOptions);
	} catch {}
}

/* ------------------------- */
/* --- Function ON Event --- */

function eventTimeBarInput() {
	// Validate and update the audio's current time
	if (!isNaN(sharedRefs.value.currentTime) && props.player)
		props.player.currentTime = sharedRefs.value.currentTime;
}

function eventTimeUpdate() {
	// Update currentTime
	sharedRefs.value.currentTime = props.player.currentTime;

	// IF outside chunk, simulate the end
	if (sharedRefs.value.currentTime > options.value.chunk.endTime)
		props.player.dispatchEvent(new Event("ended", { bubbles: true }));
}

function eventPlayerPlay() {
	// Update icon
	initIcon(playpause_btn.value, "pause");
}

function eventPlayerPause() {
	// Update icon
	initIcon(playpause_btn.value, "play");
}
</script>
