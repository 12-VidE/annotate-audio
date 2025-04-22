<template>
	<div class="layout--default">
		<div
			ref="stickyContainer"
			:class="['main-container', options.sticky && 'is-sticky']"
		>
			<div :class="['inputs-container']">
				<!-- Player Controls -->
				<div :class="['controls-container']">
					<!-- Play/Pause Control -->
					<button
						type="button"
						ref="playpause_btn"
						:class="[
							'playpause_btn',
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
					<!-- Movement Controls -->
					<div
						:class="[
							'movement-container',
							sharedRefs.isCommentInputShown.value &&
								!options.unstoppable &&
								'disabled',
						]"
					>
						<button
							type="button"
							ref="backward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									options.chunk,
									sharedRefs.currentTime,
									sharedRefs.currentTime.value - 5
								)
							"
						></button>
						<button
							type="button"
							ref="forward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									options.chunk,
									sharedRefs.currentTime,
									sharedRefs.currentTime.value + 5
								)
							"
						></button>
					</div>
				</div>
				<!-- TimeLine Numbers -->
				<div :class="['timeline-numbers']">
					<span>{{ displayCurrentTime }}</span>
					<span>- {{ displayDuration }}</span>
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
				<!-- Stacked Buttons -->
				<div
					:class="[
						'stacked-btns-container',
						sharedRefs.isCommentInputShown.value && 'disabled',
					]"
				>
					<!-- "Properies" Button-->
					<button
						type="button"
						ref="openProperties_btn"
						:class="['openProperties_btn']"
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
					<!-- "Add Comment" Button -->
					<button
						ref="showCommentInput_btn"
						:class="[
							'commentInput_btn',
							sharedRefs.isCommentInputShown.value && 'disabled',
						]"
						@click="sharedRefs.isCommentInputShown.value = true"
					></button>
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
import { MarkdownPostProcessorContext, App, setIcon } from "obsidian";
// Import - Component
import CommentInput from "../comment/CommentInput.vue";
import CommentsList from "../comment/CommentsList.vue";
// Import - Type
import type { SharedRefs } from "../components/sharedRefs";
import type { AudioBoxOptions } from "src/options/optionsType";
// Import - Class
import { PropertiesModal } from "src/options/optionsModal";
// Import - Functions
import { togglePlayer, setPlayerPosition, pausePlayer } from "../playerLogic";
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

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

// UI
const playpause_btn = ref<HTMLElement | null>(null);
const showCommentInput_btn = ref<HTMLElement | null>(null);
const openProperties_btn = ref<HTMLElement | null>(null);
const backward_btn = ref<HTMLElement | null>(null);
const forward_btn = ref<HTMLElement | null>(null);

onMounted(() => {
	// Initialize icons
	initIcon(playpause_btn.value, "play");
	initIcon(showCommentInput_btn.value, "bookmark-plus");
	initIcon(openProperties_btn.value, "settings-2");
	initIcon(backward_btn.value, "chevrons-left");
	initIcon(forward_btn.value, "chevrons-right");

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

/* ---------------- */
/* --- Function --- */
/* ---------------- */

/* ------------------------- */
/* --- Function ON Event --- */

function eventTimeBarInput(): void {
	// Validate and update the audio's current time
	if (!isNaN(props.sharedRefs.currentTime.value) && props.player)
		props.player.currentTime = props.sharedRefs.currentTime.value;
}

function eventTimeUpdate(): void {
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
