<template>
	<div class="layout--big">
		<!-- Title -->
		<div v-show="title" :class="['audiobox-title']">
			<span ref="titleIcon"></span>
			{{ title }}
		</div>
		<!-- WaveGraph -->
		<div
			:class="[
				'wavegraph',
				sharedRefs.isCommentInputShown.value && 'disabled',
			]"
		>
			<div
				v-for="(s, i) in barHeights"
				:class="{ bar: true, playedBar: i <= currentBar }"
				:key="props.sharedRefs.srcPath.value + i"
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
					sharedRefs.isCommentInputShown.value && 'disabled',
				]"
			>
				<input
					type="range"
					:min="options.chunk?.startTime"
					:max="options.chunk?.endTime"
					step="0.1"
					v-model="sharedRefs.currentTime.value"
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
						sharedRefs.isCommentInputShown.value && 'disabled',
					]"
					@click="
						pausePlayer(player, sharedRefs.currentTime);
						new PropertiesModal(
							source,
							ctx,
							container,
							obsidianApp,
							sharedRefs.maxDuration.value!
						).openPropertiesModal();
					"
				></button>
				<!-- Backward -->
				<button
					type="button"
					:class="[
						'control_btn',
						'secondary_btn',
						sharedRefs.isCommentInputShown.value &&
							!options.unstoppable &&
							'disabled',
					]"
					@click="
						setPlayerPosition(
							player,
							options.chunk,
							sharedRefs.currentTime,
							sharedRefs.currentTime.value - 5
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
						sharedRefs.isCommentInputShown.value &&
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
						sharedRefs.isCommentInputShown.value &&
							!options.unstoppable &&
							'disabled',
					]"
					@click="
						setPlayerPosition(
							player,
							options.chunk,
							sharedRefs.currentTime,
							sharedRefs.currentTime.value + 5
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
						sharedRefs.isCommentInputShown.value && 'disabled',
					]"
					@click="sharedRefs.isCommentInputShown.value = true"
				></button>
			</div>
			<!-- Comment Input -->
			<CommentInput
				:id="id"
				:source="source"
				:container="container"
				:ctx="ctx"
				:player="player"
				:obsidianApp="obsidianApp"
				:sharedRefs="sharedRefs"
				:options="options"
			/>
		</div>

		<!-- Comments List -->
		<CommentsList
			:id="id"
			:source="source"
			:player="player"
			:obsidianApp="obsidianApp"
			:sharedRefs="sharedRefs"
			:options="options"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
// Import - Component
import CommentInput from "../comment/CommentInput.vue";
import CommentsList from "../comment/CommentsList.vue";
// Import - Type
import type { AudioChunk } from "src/types";
import type { SharedRefs } from "../components/sharedRefs";
// Import - Class
import { AudioBoxOptions, PropertiesModal } from "src/options";
// Import - Functions
import { displayTitle } from "./layoutLogic";
import { togglePlayer, setPlayerPosition, pausePlayer } from "../playerLogic";
import { getAudioboxOptions } from "../components/Logic/codeblockFunc";
import { hashObj, initIcon, secondsToTime } from "src/utils";

const props = defineProps<{
	id: string;
	source: string;
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
}>();

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
	const newHash = await hashObj(props.options);
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
		Math.floor(props.sharedRefs.currentTime.value),
		props.sharedRefs.maxDuration.value
	)
);

const displayDuration = computed(() =>
	secondsToTime(
		props.options.chunk.endTime,
		props.sharedRefs.maxDuration.value
	)
);

const currentBar = computed(() => {
	return Math.floor(
		((props.sharedRefs.currentTime.value - props.options.chunk.startTime) /
			props.options.chunk.duration!) *
			nSamples
	);
});

const title = computed(() => displayTitle(props.source, props.options.title));

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
					props.options.chunk?.startTime! * audioSampleRate
				),
				endTime: Math.floor(
					props.options.chunk?.endTime! * audioSampleRate
				),
			}; // Portion of audio to play (can be entire file)
			const barWidth = Math.floor(
				(playedChunk.endTime - playedChunk.startTime) / nSamples
			);
			let highestBar = 0;
			for (let i = 0; i < nSamples; i++) {
				let blockStart = props.options.chunk?.startTime! + barWidth * i;
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

/* ------------------------- */
/* --- Function ON Event --- */

function eventTimeBarInput() {
	// Validate and update the audio's current time
	if (!isNaN(props.sharedRefs.currentTime.value) && props.player)
		props.player.currentTime = props.sharedRefs.currentTime.value;
}

function eventTimeUpdate() {
	// Update currentTime
	props.sharedRefs.currentTime.value = props.player.currentTime;

	// IF outside chunk, simulate the end
	if (props.sharedRefs.currentTime.value > props.options.chunk.endTime)
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
