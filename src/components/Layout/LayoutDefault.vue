<template>
	<div class="layout--default">
		<!-- Title -->
		<div v-show="displayTitle(ctx, container)" :class="['audiobox-title']">
			<span ref="titleIcon"></span>{{ displayTitle(ctx, container) }}
		</div>
		<!-- WaveGraph -->
		<div :class="['wavegraph', isCommentInputShown && 'disabled']">
			<div
				v-for="(s, i) in barHeights"
				:class="{ bar: true, playedBar: i <= currentBar }"
				:key="srcPath + i"
				:style="{ height: s * 6 + 'rem' }"
			></div>
		</div>
		<div
			ref="stickyContainer"
			:class="['main-container', isSticky && 'is-sticky']"
		>
			<!-- Timeline -->
			<div
				:class="[
					'timeline-container',
					isCommentInputShown && 'disabled',
				]"
			>
				<input
					type="range"
					:min="chunk?.startTime"
					:max="chunk?.endTime"
					step="0.1"
					v-model="currentTime"
					@input="onTimeBarInput"
				/>
				<div :class="['timeline-numbers']">
					<span>{{ displayCurrentTime }}</span>
					<span>{{ displayDuration }}</span>
				</div>
			</div>
			<!-- Controls -->
			<div
				:class="[
					'controls-container',
					isCommentInputShown && 'disabled',
				]"
			>
				<div
					:class="['control_btn', 'secondary_btn']"
					@click="setPlayerPosition(props.player, currentTime - 5)"
				>
					-5s
				</div>
				<div
					ref="playpause_btn"
					:class="['control_btn']"
					@click="
						togglePlayer(props.ctx, props.container, props.player)
					"
				></div>
				<div
					:class="['control_btn', 'secondary_btn']"
					@click="setPlayerPosition(props.player, currentTime + 5)"
				>
					+5s
				</div>
				<div
					ref="showCommentInput_btn"
					:class="['commentInput_btn', 'control_btn']"
					@click="isCommentInputShown = true"
				></div>
			</div>
			<!-- Comment Input -->
			<CommentInput
				:container="container"
				:ctx="ctx"
				:audioSource="audioSource"
				:player="player"
				:obsidianApp="obsidianApp"
			/>
		</div>
		<!-- Comments List -->
		<CommentList
			:container="container"
			:ctx="ctx"
			:audioSource="audioSource"
			:player="player"
			:obsidianApp="obsidianApp"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownPostProcessorContext, App, setIcon, TFile } from "obsidian";
// Import - Component
import CommentInput from "../Comment/CommentInput.vue";
import CommentList from "../Comment/CommentList.vue";
// Import - Func
import {
	displayCurrentTime,
	displayTitle,
	displayDuration,
} from "./LayoutSharedFunc";
import {
	togglePlayer,
	pausePlayer,
	setPlayerPosition,
} from "../Logic/playerFunc";
// Import - Ref
import {
	isCommentInputShown,
	chunk,
	currentTime,
	isSticky,
	srcPath,
	isCached,
} from "../sharedRefs";
// Import - Type
import { AudioChunk } from "src/types";

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

/* ------------ */
/* --- Refs --- */
/* ------------ */
// UI
const titleIcon = ref<HTMLElement | null>(null);
const playpause_btn = ref<HTMLElement | null>(null);
const showCommentInput_btn = ref<HTMLElement | null>(null);
// WaveGraph
const nSamples = ref<number>(150); // N° of bars in WaveGraph
const barHeights = ref<number[]>([]); // Height of the bars of the graph

onMounted(async () => {
	// Initialize icons
	if (titleIcon.value) setIcon(titleIcon.value, "audio-lines");
	if (playpause_btn.value) setIcon(playpause_btn.value, "play");
	if (showCommentInput_btn.value)
		setIcon(showCommentInput_btn.value, "bookmark-plus");

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}

	// Initialize Wavegraph
	if (isCached.value) {
		barHeights.value = JSON.parse(
			localStorage[`${props.audioSource}_barHeights`]
		);
	} else {
		await calculateWaveGraph();
	}
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	props.player.removeEventListener("timeupdate", eventTimeUpdate);
	props.player.removeEventListener("play", eventPlayerPlay);
	props.player.removeEventListener("pause", eventPlayerPause);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const currentBar = computed(() => {
	return Math.floor(
		((currentTime.value - chunk.value?.startTime!) /
			chunk.value?.duration!) *
			nSamples.value
	);
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

function onTimeBarInput() {
	// Validate and update the audio's current time
	if (!isNaN(currentTime.value) && props.player)
		props.player.currentTime = currentTime.value;
}

async function calculateWaveGraph() {
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
					chunk.value?.startTime! * audioSampleRate
				),
				endTime: Math.floor(chunk.value?.endTime! * audioSampleRate),
			}; // Portion of audio to play (can be entire file)
			const barWidth = Math.floor(
				(playedChunk.endTime - playedChunk.startTime) / nSamples.value
			);
			let highestBar = 0;
			for (let i = 0; i < nSamples.value; i++) {
				let blockStart = chunk.value?.startTime! + barWidth * i;
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
			barHeights.value = tempArray.map((x) => x / highestBar);
			localStorage[`${props.audioSource}_barHeights`] = JSON.stringify(
				barHeights.value
			);
		});
	}
}

function eventTimeUpdate() {
	// Update currentTime #TODO rendi > generico
	currentTime.value = props.player.currentTime;

	// IF outside chunk, simulate the end
	if (currentTime.value > chunk.value?.endTime!)
		props.player.dispatchEvent(new Event("ended", { bubbles: true }));
}

function eventPlayerPlay() {
	// Update icon
	setIcon(playpause_btn.value!, "pause");
}

function eventPlayerPause() {
	// Update icon
	setIcon(playpause_btn.value!, "play");
}
</script>
