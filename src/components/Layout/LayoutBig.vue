<template>
	<div class="layout--big">
		<!-- Title -->
		<div v-show="title" :class="['audiobox-title']">
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
					<span>{{
						displayCurrentTime(sharedRefs.currentTime.value)
					}}</span>
					<span>{{ displayDuration(options.chunk) }}</span>
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
							player,
							audioSource,
							options.chunk,
							sharedRefs.currentTime
						);
						new PropertiesModal(
							ctx,
							container,
							obsidianApp,
							sharedRefs.maxDuration.value!
						).openPropertiesModal();
					"
				></div>
				<!-- Backward -->
				<div
					:class="['control_btn', 'secondary_btn']"
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
				</div>
				<!-- Play/Pause -->
				<div
					ref="playpause_btn"
					:class="['control_btn']"
					@click="
						togglePlayer(
							player,
							audioSource,
							options.chunk,
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
							options.chunk,
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
				:options="options"
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
			:options="options"
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
import { AudioBoxOptions, PropertiesModal } from "src/options";
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
import { getAudioboxOptions } from "../Logic/codeblockFunc";
import { hashObj } from "src/utils";

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
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

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(async () => {
	// Initialize icons
	if (titleIcon.value) setIcon(titleIcon.value, "audio-lines");
	if (playpause_btn.value) setIcon(playpause_btn.value, "play");
	if (showCommentInput_btn.value)
		setIcon(showCommentInput_btn.value, "bookmark-plus");
	if (showProperties_btn.value)
		setIcon(showProperties_btn.value, "settings-2");

	// Initialize Wavegraph #TODO poco elegante
	const codeblockSettings = getAudioboxOptions(
		props.ctx,
		props.container,
		props.sharedRefs.maxDuration.value!
	);
	const newHash = await hashObj(codeblockSettings);
	const oldHash = localStorage.getItem(`aa_${props.audioSource}_optionsHash`);
	if (newHash === oldHash) {
		const cachedBarHeights = localStorage.getItem(
			`aa_${props.audioSource}_barHeights`
		);
		if (cachedBarHeights) barHeights.value = JSON.parse(cachedBarHeights);
		else barHeights.value = await calculateWaveGraph();
	} else barHeights.value = await calculateWaveGraph();

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}

	/* logRefs(props.sharedRefs); */
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	props.player.removeEventListener("timeupdate", eventTimeUpdate);
	props.player.removeEventListener("play", eventPlayerPlay);
	props.player.removeEventListener("pause", eventPlayerPause);

	// Save cache
	localStorage.setItem(
		`aa_${props.audioSource}_barHeights`,
		JSON.stringify(barHeights.value)
	);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const currentBar = computed(() => {
	return Math.floor(
		((props.sharedRefs.currentTime.value - props.options.chunk.startTime) /
			props.options.chunk.duration!) *
			nSamples.value
	);
});

const title = computed(() =>
	displayTitle(props.ctx, props.container, props.options.title)
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
					props.options.chunk?.startTime! * audioSampleRate
				),
				endTime: Math.floor(
					props.options.chunk?.endTime! * audioSampleRate
				),
			}; // Portion of audio to play (can be entire file)
			const barWidth = Math.floor(
				(playedChunk.endTime - playedChunk.startTime) / nSamples.value
			);
			let highestBar = 0;
			for (let i = 0; i < nSamples.value; i++) {
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
	return [];
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
	if (props.sharedRefs.currentTime.value > props.options.chunk?.endTime!)
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
