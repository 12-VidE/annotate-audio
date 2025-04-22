<template>
	<div class="layout--geek">
		<!-- Title -->
		<div v-show="title" :class="['audiobox-title']">
			<span ref="titleIcon"></span>
			{{ title }}
		</div>
		<div
			ref="stickyContainer"
			:class="['main-container', options.sticky && 'is-sticky']"
		>
			<!-- Main Controls -->
			<div :class="['main-controls-container']">
				<span :class="['timeline-number']">{{
					displayCurrentTime
				}}</span>

				<div :class="['controls-container']">
					<!-- Properties -->
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
								options,
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
								sharedRefs.currentTime.value + 5
							)
						"
					>
						+5s
					</button>
					<!-- Add Comment -->
					<button
						type="button"
						ref="showCommentInput_btn"
						:class="[
							'commentInput_btn',
							'control_btn',
							sharedRefs.isCommentInputShown.value && 'disabled',
						]"
						@click="sharedRefs.isCommentInputShown.value = true"
					></button>
				</div>

				<span :class="['timeline-number']">{{ displayDuration }}</span>
			</div>

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
			</div>

			<!-- Secondary Controls -->
			<div
				:class="[
					'secondary-controls-container',
					sharedRefs.isCommentInputShown.value && 'disabled',
				]"
			>
				<!-- 1° Row -->
				<div class="row">
					<!-- Loop -->
					<button
						type="button"
						ref="loop_toggle"
						:class="{ active: options.loop }"
						@click="options.loop = !options.loop"
					></button>
					<!-- Autoplay -->
					<button
						type="button"
						ref="autoplay_toggle"
						:class="{ active: options.autoplay }"
						@click="options.autoplay = !options.autoplay"
					></button>
					<!-- Unstoppable -->
					<button
						type="button"
						ref="unstoppable_toggle"
						:class="{ active: options.unstoppable }"
						@click="options.unstoppable = !options.unstoppable"
					></button>
					<!-- Sticky -->
					<button
						type="button"
						ref="sticky_toggle"
						:class="{ active: options.sticky }"
						@click="options.sticky = !options.sticky"
					></button>
					<!-- Chunk -->
					<button
						type="button"
						ref="chunk_btn"
						@click="manageChunk"
					></button>
				</div>
				<!-- 2° Row -->
				<div class="row">
					<!-- Volume -->
					<div class="inrow">
						<i ref="volume_icon"></i>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							v-model="options.volume"
							@change="player.volume = options.volume"
						/>
						<span class="label">{{ volume }}</span>
					</div>
					<!-- Speed -->
					<div class="inrow">
						<i ref="speed_icon"></i>
						<input
							type="range"
							min="0.3"
							max="4"
							step="0.1"
							v-model="options.speed"
							@change="player.playbackRate = options.speed"
						/>
						<span class="label">{{ speed }}</span>
					</div>
				</div>
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
import { MarkdownPostProcessorContext, App } from "obsidian";
// Import - Component
import CommentInput from "../comment/CommentInput.vue";
import CommentsList from "../comment/CommentsList.vue";
// Import - Type
import type { SharedRefs } from "../components/sharedRefs";
import type { AudioBoxOptions } from "src/options/optionsType";
// Import - Class
import { PropertiesModal } from "src/options/optionsModal";
// Import - Functions
import { displayTitle } from "./layoutLogic";
import { togglePlayer, setPlayerPosition, pausePlayer } from "../playerLogic";
import { setAudioboxOptions } from "src/options/optionsSetter";
import { initIcon, secondsToTime } from "src/utils";

const props = defineProps<{
	id: string;
	source: string;
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
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
// UI - Secondary Controls
const loop_toggle = ref<HTMLElement | null>(null);
const autoplay_toggle = ref<HTMLElement | null>(null);
const unstoppable_toggle = ref<HTMLElement | null>(null);
const sticky_toggle = ref<HTMLElement | null>(null);
const chunk_btn = ref<HTMLElement | null>(null);
const volume_icon = ref<HTMLElement | null>(null);
const speed_icon = ref<HTMLElement | null>(null);

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(async () => {
	// Initialize icons - Primary
	initIcon(titleIcon.value, "audio-lines");
	initIcon(playpause_btn.value, "play");
	initIcon(showCommentInput_btn.value, "bookmark-plus");
	initIcon(showProperties_btn.value, "settings-2");
	// Initialize icons + Tooltip - Secondary
	initIcon(loop_toggle.value, "repeat", "Loop");
	initIcon(autoplay_toggle.value, "square-play", "Autoplay");
	initIcon(unstoppable_toggle.value, "shield", "Unstoppable");
	initIcon(sticky_toggle.value, "pin", "Sticky");
	initIcon(volume_icon.value, "volume-2", "Volume");
	initIcon(speed_icon.value, "gauge", "Playback speed");

	setTimeout(() => {
		styleChunkBnt();
		// Need time to get maxDuration
	}, 50);

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
	// Save options
	setAudioboxOptions(
		props.ctx,
		props.container,
		props.obsidianApp,
		props.options
	);
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

const title = computed(() => displayTitle(props.source, props.options.title));

const volume = computed(() => Number(props.options.volume).toFixed(1));

const speed = computed(() => Number(props.options.speed).toFixed(1));

/* ---------------- */
/* --- Function --- */
/* ---------------- */

function styleChunkBnt() {
	if (props.options.chunk.startTime == 0) {
		// Set chunk startTime
		initIcon(chunk_btn.value, "arrow-left-to-line", "Chunk: Select start");
	} else if (
		props.options.chunk.endTime ==
		Math.floor(props.sharedRefs.maxDuration.value!)
	) {
		// Set chunk endTime
		initIcon(chunk_btn.value, "arrow-right-to-line", "Chunk: Select end");
	} else {
		// Reset chunk
		initIcon(chunk_btn.value, "fold-horizontal", "Chunk: Delete");
	}
}

function manageChunk() {
	if (props.options.chunk.startTime == 0) {
		props.options.chunk.startTime = Math.floor(props.player.currentTime);
	} else if (
		props.options.chunk.endTime ==
		Math.floor(props.sharedRefs.maxDuration.value!)
	) {
		if (props.player.currentTime > props.options.chunk.startTime)
			props.options.chunk.endTime = Math.floor(props.player.currentTime);
	} else {
		props.options.chunk = {
			startTime: 0,
			endTime: Math.floor(props.sharedRefs.maxDuration.value!),
		};
	}
	styleChunkBnt();
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
