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
								sharedRefs.currentTime + 5
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
							sharedRefs.isCommentInputShown && 'disabled',
						]"
						@click="sharedRefs.isCommentInputShown = true"
					></button>
				</div>

				<span :class="['timeline-number']">{{ displayDuration }}</span>
			</div>

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
			</div>

			<!-- Secondary Controls -->
			<div
				:class="[
					'secondary-controls-container',
					sharedRefs.isCommentInputShown && 'disabled',
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
import { App } from "obsidian";
// Import - Component
import CommentInput from "../comment/CommentInput.vue";
import CommentsList from "../comment/CommentsList.vue";
// Import - Type
import type { SharedRefs } from "src/types";
import type { AudioBoxOptions } from "src/options/optionsType";
import type { AudioComment } from "src/comment/commentType";
// Import - Class
import { optionsModal } from "src/options/optionsModal";
// Import - Functions
import { displayTitle } from "./layoutLogic";
import { initIcon, secondsToTime } from "src/utils";
import { togglePlayer, pausePlayer, setPlayerPosition } from "src/playerLogic";

const props = defineProps<{
	id: string;
	player: HTMLAudioElement;
	obsidianApp: App;
}>();

const sharedRefs = defineModel<SharedRefs>("sharedRefs", { required: true });
const options = defineModel<AudioBoxOptions>("options", { required: true });
const comments = defineModel<AudioComment[]>("comments", {
	required: true,
});

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
	}, 50); // Need time to get maxDuration

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

const title = computed(() =>
	displayTitle(options.value.source, options.value.title)
);

const volume = computed(() => Number(options.value.volume).toFixed(1));

const speed = computed(() => Number(options.value.speed).toFixed(1));

/* ---------------- */
/* --- Function --- */
/* ---------------- */

function styleChunkBnt() {
	if (options.value.chunk.startTime == 0) {
		// Set chunk startTime
		initIcon(chunk_btn.value, "arrow-left-to-line", "Chunk: Select start");
	} else if (
		options.value.chunk.endTime == Math.floor(sharedRefs.value.maxDuration!)
	) {
		// Set chunk endTime
		initIcon(chunk_btn.value, "arrow-right-to-line", "Chunk: Select end");
	} else {
		// Reset chunk
		initIcon(chunk_btn.value, "fold-horizontal", "Chunk: Delete");
	}
}

function manageChunk() {
	if (options.value.chunk.startTime == 0) {
		options.value.chunk.startTime = Math.floor(props.player.currentTime);
	} else if (
		options.value.chunk.endTime == Math.floor(sharedRefs.value.maxDuration!)
	) {
		if (props.player.currentTime > options.value.chunk.startTime)
			options.value.chunk.endTime = Math.floor(props.player.currentTime);
	} else {
		options.value.chunk = {
			startTime: 0,
			endTime: Math.floor(sharedRefs.value.maxDuration!),
		};
	}
	styleChunkBnt();
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
