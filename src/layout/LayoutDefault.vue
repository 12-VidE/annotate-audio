<template>
	<div class="layout--default">
		<!-- Sticky Container -->
		<div
			ref="stickyContainer"
			:class="['main-container', options.sticky && 'is-sticky']"
		>
			<div :class="['inputs-container']">
				<!-- Player Controls -->
				<div :class="['controls-container']">
					<!-- Play/Pause -->
					<button
						type="button"
						ref="playpause_btn"
						:class="[
							'playpause_btn',
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
					<!-- Movement Controls -->
					<div
						:class="[
							'movement-container',
							sharedRefs.isCommentInputShown &&
								!options.unstoppable &&
								'disabled',
						]"
					>
						<!-- Backward -->
						<button
							type="button"
							ref="backward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									options.chunk,
									sharedRefs.currentTime,
									sharedRefs.currentTime - 5
								)
							"
						></button>
						<!-- Forward -->
						<button
							type="button"
							ref="forward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									options.chunk,
									sharedRefs.currentTime,
									sharedRefs.currentTime + 5
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
				<!-- Stacked Buttons -->
				<div
					:class="[
						'stacked-btns-container',
						sharedRefs.isCommentInputShown && 'disabled',
					]"
				>
					<!-- "Properies" Button-->
					<button
						type="button"
						ref="openProperties_btn"
						:class="['openProperties_btn']"
						@click="
							pausePlayer(player, sharedRefs.currentTime);
							openOptionsModal();
						"
					></button>
					<!-- "Add Comment" Button -->
					<button
						ref="showCommentInput_btn"
						:class="[
							'commentInput_btn',
							sharedRefs.isCommentInputShown && 'disabled',
						]"
						@click="sharedRefs.isCommentInputShown = true"
					></button>
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
import { togglePlayer, setPlayerPosition, pausePlayer } from "../playerLogic";
import { initIcon, secondsToTime } from "src/utils";
import { t } from "src/lang/helpers";

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
	// Initialize - Icons
	initIcon(playpause_btn.value, "play");
	initIcon(showCommentInput_btn.value, "bookmark-plus");
	initIcon(openProperties_btn.value, "settings-2");
	initIcon(backward_btn.value, "chevrons-left");
	initIcon(forward_btn.value, "chevrons-right");

	// Initialize - Event-Listeners
	if (props.player) {
		props.player.addEventListener("timeupdate", eventTimeUpdate);
		props.player.addEventListener("play", eventPlayerPlay);
		props.player.addEventListener("pause", eventPlayerPause);
	}
});

onBeforeUnmount(() => {
	// Destroy - Event-Listeners
	props.player.removeEventListener("timeupdate", eventTimeUpdate);
	props.player.removeEventListener("play", eventPlayerPlay);
	props.player.removeEventListener("pause", eventPlayerPause);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const displayCurrentTime = computed(() =>
	secondsToTime(
		sharedRefs.value.currentTime,
		options.value.decimals,
		sharedRefs.value.maxDuration
	)
);

const displayDuration = computed(() =>
	secondsToTime(
		options.value.chunk.endTime,
		options.value.decimals,
		sharedRefs.value.maxDuration
	)
);

/* ---------------- */
/* --- Function --- */
/* ---------------- */

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

function eventTimeBarInput(): void {
	// Validate and update the audio's current time
	if (!isNaN(sharedRefs.value.currentTime) && props.player)
		props.player.currentTime = sharedRefs.value.currentTime;
}

function eventTimeUpdate(): void {
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
