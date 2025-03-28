<template>
	<div class="layout--big">
		<!-- Title -->
		<div v-if="title" :class="['audiobox-title']">
			<span ref="titleIcon"></span>{{ title }}
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
			:class="[
				'main-container',
				sharedRefs.isSticky.value && 'is-sticky',
			]"
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
					:min="sharedRefs.chunk.value?.startTime"
					:max="sharedRefs.chunk.value?.endTime"
					step="0.1"
					v-model="sharedRefs.currentTime.value"
					@input="eventTimeBarInput"
				/>
				<div :class="['timeline-numbers']">
					<span>{{
						displayCurrentTime(sharedRefs.currentTime.value)
					}}</span>
					<span>{{ displayDuration(sharedRefs.chunk.value) }}</span>
				</div>
			</div>
			<!-- Controls -->
			<div
				:class="[
					'controls-container',
					sharedRefs.isCommentInputShown.value && 'disabled',
				]"
			>
				<!-- Properies -->
				<div
					ref="showProperties_btn"
					:class="['commentInput_btn', 'control_btn']"
					@click="
						pausePlayer(
							ctx,
							container,
							player,
							sharedRefs.chunk.value,
							sharedRefs.currentTime
						);
						new PropertiesModal(
							ctx,
							container,
							obsidianApp,
							sharedRefs.totalDuration.value!
						).openPropertiesModal();
					"
				></div>
				<!-- Backward -->
				<div
					:class="['control_btn', 'secondary_btn']"
					@click="
						setPlayerPosition(
							player,
							sharedRefs.chunk.value,
							sharedRefs.currentTime,
							sharedRefs.currentTime.value - 5
						)
					"
				>
					-5s
				</div>
				<!-- Play/Pause -->
				<div
					ref="playpause_btn"
					:class="['control_btn']"
					@click="
						togglePlayer(
							ctx,
							container,
							player,
							sharedRefs.chunk.value,
							sharedRefs.currentTime
						)
					"
				></div>
				<!-- Forward -->
				<div
					:class="['control_btn', 'secondary_btn']"
					@click="
						setPlayerPosition(
							player,
							sharedRefs.chunk.value,
							sharedRefs.currentTime,
							sharedRefs.currentTime.value + 5
						)
					"
				>
					+5s
				</div>
				<!-- Add Comment -->
				<div
					ref="showCommentInput_btn"
					:class="['commentInput_btn', 'control_btn']"
					@click="sharedRefs.isCommentInputShown.value = true"
				></div>
			</div>
			<!-- Comment Input -->
			<CommentInput
				:container="container"
				:ctx="ctx"
				:audioSource="audioSource"
				:player="player"
				:obsidianApp="obsidianApp"
				:sharedRefs="sharedRefs"
			/>
		</div>
		<!-- Comments List -->
		<CommentList
			:container="container"
			:ctx="ctx"
			:audioSource="audioSource"
			:player="player"
			:obsidianApp="obsidianApp"
			:sharedRefs="sharedRefs"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownPostProcessorContext, App, setIcon, TFile } from "obsidian";
// Import - Component
import CommentInput from "../Comment/CommentInput.vue";
import CommentList from "../Comment/CommentList.vue";
// Import - Class
import { PropertiesModal } from "src/options";
// Import - Func
import {
	displayCurrentTime,
	displayTitle,
	displayDuration,
} from "./LayoutSharedFunc";
import {
	togglePlayer,
	setPlayerPosition,
	pausePlayer,
} from "../Logic/playerFunc";
// Import - Type
import type { AudioChunk } from "src/types";
import type { SharedRefs } from "../sharedRefs";
import { logRefs } from "../sharedFunc";

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
}>();

/* ------------ */
/* --- Refs --- */
/* ------------ */
// UI
const titleIcon = ref<HTMLElement | null>(null);
const playpause_btn = ref<HTMLElement | null>(null);
const showCommentInput_btn = ref<HTMLElement | null>(null);
const showProperties_btn = ref<HTMLElement | null>(null);
// WaveGraph
const nSamples = ref<number>(150); // N° of bars in WaveGraph
const barHeights = ref<number[]>([]); // Height of the bars of the graph

onMounted(async () => {
	// Initialize icons
	if (titleIcon.value) setIcon(titleIcon.value, "audio-lines");
	if (playpause_btn.value) setIcon(playpause_btn.value, "play");
	if (showCommentInput_btn.value)
		setIcon(showCommentInput_btn.value, "bookmark-plus");
	if (showProperties_btn.value)
		setIcon(showProperties_btn.value, "settings-2");

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}

	// Initialize Wavegraph
	if (props.sharedRefs.isCached.value) {
		barHeights.value = JSON.parse(
			localStorage[`${props.audioSource}_barHeights`]
		);
	} else {
		await calculateWaveGraph();
	}

	/* logRefs(props.sharedRefs); */
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
		((props.sharedRefs.currentTime.value -
			props.sharedRefs.chunk.value?.startTime!) /
			props.sharedRefs.chunk.value?.duration!) *
			nSamples.value
	);
});

const title = computed(() => displayTitle(props.ctx, props.container));

/* ---------------- */
/* --- Function --- */
/* ---------------- */

async function calculateWaveGraph() {
	console.time("calculateWaveGraph");
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
					props.sharedRefs.chunk.value?.startTime! * audioSampleRate
				),
				endTime: Math.floor(
					props.sharedRefs.chunk.value?.endTime! * audioSampleRate
				),
			}; // Portion of audio to play (can be entire file)
			const barWidth = Math.floor(
				(playedChunk.endTime - playedChunk.startTime) / nSamples.value
			);
			let highestBar = 0;
			for (let i = 0; i < nSamples.value; i++) {
				let blockStart =
					props.sharedRefs.chunk.value?.startTime! + barWidth * i;
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
	console.timeEnd("calculateWaveGraph");
}

/* ------------------------- */
/* --- Function ON Event --- */

function eventTimeBarInput() {
	// Validate and update the audio's current time
	if (!isNaN(props.sharedRefs.currentTime.value) && props.player)
		props.player.currentTime = props.sharedRefs.currentTime.value;
}

function eventTimeUpdate() {
	// Update currentTime #TODO rendi > generico
	props.sharedRefs.currentTime.value = props.player.currentTime;

	// IF outside chunk, simulate the end
	if (
		props.sharedRefs.currentTime.value >
		props.sharedRefs.chunk.value?.endTime!
	)
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
