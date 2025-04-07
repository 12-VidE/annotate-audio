<template>
	<div class="layout--geek">
		<!-- Title -->
		<div v-show="title" :class="['audiobox-title']">
			<i ref="titleIcon"></i>{{ title }}
		</div>
		<div
			ref="stickyContainer"
			:class="['main-container', options.sticky && 'is-sticky']"
		>
			<!-- Main Controls -->
			<div :class="['main-controls-container']">
				<span :class="['timeline-number']">{{
					displayCurrentTime(
						sharedRefs.currentTime.value,
						sharedRefs.maxDuration.value
					)
				}}</span>

				<div :class="['controls-container']">
					<!-- Properties -->
					<div
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
					></div>
					<!-- Backward -->
					<div
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
					</div>
					<!-- Play/Pause -->
					<div
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
					></div>
					<!-- Forward -->
					<div
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
					</div>
					<!-- Add Comment -->
					<div
						ref="showCommentInput_btn"
						:class="[
							'commentInput_btn',
							'control_btn',
							sharedRefs.isCommentInputShown.value && 'disabled',
						]"
						@click="sharedRefs.isCommentInputShown.value = true"
					></div>
				</div>

				<span :class="['timeline-number']">{{
					displayDuration(options.chunk, sharedRefs.maxDuration.value)
				}}</span>
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
					<i
						ref="loop_toggle"
						:class="{ active: options.loop }"
						@click="options.loop = !options.loop"
					>
					</i>
					<!-- Autoplay -->
					<i
						ref="autoplay_toggle"
						:class="{ active: options.autoplay }"
						@click="options.autoplay = !options.autoplay"
					>
					</i>
					<!-- Unstoppable -->
					<i
						ref="unstoppable_toggle"
						:class="{ active: options.unstoppable }"
						@click="options.unstoppable = !options.unstoppable"
					>
					</i>
					<!-- Sticky -->
					<i
						ref="sticky_toggle"
						:class="{ active: options.sticky }"
						@click="options.sticky = !options.sticky"
					>
					</i>
					<!-- Chunk -->
					<i ref="chunk_btn" @click="manageChunk"> </i>
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
				:audioSource="audioSource"
				:player="player"
				:obsidianApp="obsidianApp"
				:sharedRefs="sharedRefs"
				:options="options"
			/>
		</div>

		<!-- Comments List -->
		<CommentList
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
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
	MarkdownPostProcessorContext,
	App,
	setIcon,
	setTooltip,
} from "obsidian";
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
import type { SharedRefs } from "../sharedRefs";
import { logRefs } from "../sharedFunc";
import { setAudioboxOptions } from "../Logic/codeblockFunc";

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
	if (titleIcon.value) setIcon(titleIcon.value, "audio-lines");
	if (playpause_btn.value) setIcon(playpause_btn.value, "play");
	if (showCommentInput_btn.value)
		setIcon(showCommentInput_btn.value, "bookmark-plus");
	if (showProperties_btn.value)
		setIcon(showProperties_btn.value, "settings-2");
	// Initialize icons + Tooltip - Secondary
	if (loop_toggle.value) {
		setIcon(loop_toggle.value, "repeat");
		setTooltip(loop_toggle.value, "Loop");
	}
	if (autoplay_toggle.value) {
		setIcon(autoplay_toggle.value, "square-play");
		setTooltip(autoplay_toggle.value, "Autoplay");
	}
	if (unstoppable_toggle.value) {
		setIcon(unstoppable_toggle.value, "shield");
		setTooltip(unstoppable_toggle.value, "Unstoppable");
	}
	if (sticky_toggle.value) {
		setIcon(sticky_toggle.value, "pin");
		setTooltip(sticky_toggle.value, "Sticky");
	}
	if (volume_icon.value) {
		setIcon(volume_icon.value, "volume-2");
		setTooltip(volume_icon.value, "Volume");
	}
	if (speed_icon.value) {
		setIcon(speed_icon.value, "gauge");
		setTooltip(speed_icon.value, "Playback speed");
	}

	setTimeout(() => {
		setupChunkBnt();
		// Need time to get maxDuration
	}, 50);

	// Initialize Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}
	/* logRefs(props.sharedRefs); */
});

onBeforeUnmount(() => {
	// Save options
	setAudioboxOptions(
		props.ctx,
		props.container,
		props.obsidianApp,
		props.options
	);

	// Destroy Event-Listeners
	props.player.removeEventListener("timeupdate", eventTimeUpdate);
	props.player.removeEventListener("play", eventPlayerPlay);
	props.player.removeEventListener("pause", eventPlayerPause);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const title = computed(() => displayTitle(props.source, props.options.title));

const volume = computed(() => Number(props.options.volume).toFixed(1));

const speed = computed(() => Number(props.options.speed).toFixed(1));

/* ---------------- */
/* --- Function --- */
/* ---------------- */

function setupChunkBnt() {
	if (props.options.chunk.startTime == 0) {
		// Set chunk startTime
		setIcon(chunk_btn.value!, "arrow-left-to-line");
		setTooltip(chunk_btn.value!, "Chunk: Select start");
	} else if (
		props.options.chunk.endTime ==
		Math.floor(props.sharedRefs.maxDuration.value!)
	) {
		// Set chunk endTime
		setIcon(chunk_btn.value!, "arrow-right-to-line");
		setTooltip(chunk_btn.value!, "Chunk: Select end");
	} else {
		// Reset chunk
		setIcon(chunk_btn.value!, "fold-horizontal");
		setTooltip(chunk_btn.value!, "Chunk: Delete");
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
	setupChunkBnt();
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
