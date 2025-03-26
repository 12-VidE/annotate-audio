<template>
	<div class="layout--minimal">
		<div
			ref="stickyContainer"
			:class="[
				'main-container',
				sharedRefs.isSticky.value && 'is-sticky',
			]"
		>
			<div :class="['inputs-container']">
				<!-- Controls -->
				<div
					:class="[
						'controls-container',
						sharedRefs.isCommentInputShown.value && 'disabled',
					]"
				>
					<!-- Play/Pause Control -->
					<div
						ref="playpause_btn"
						:class="['playpause_btn']"
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
					<!-- Movement Controls -->
					<div :class="['movement-container']">
						<div
							ref="backward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									sharedRefs.chunk.value,
									sharedRefs.currentTime,
									sharedRefs.currentTime.value - 5
								)
							"
						></div>
						<div
							ref="forward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(
									player,
									sharedRefs.chunk.value,
									sharedRefs.currentTime,
									sharedRefs.currentTime.value + 5
								)
							"
						></div>
					</div>
				</div>
				<!-- TimeLine Numbers -->
				<div :class="['timeline-numbers']">
					<span>{{
						displayCurrentTime(sharedRefs.currentTime.value)
					}}</span>
					<span>- {{ displayDuration(sharedRefs.chunk.value) }}</span>
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
						:min="sharedRefs.chunk.value?.startTime"
						:max="sharedRefs.chunk.value?.endTime"
						step="0.1"
						v-model="sharedRefs.currentTime.value"
						@input="eventTimeBarInput"
					/>
				</div>
				<!-- Add Comment Control -->
				<div
					ref="showCommentInput_btn"
					:class="[
						'commentInput_btn',
						sharedRefs.isCommentInputShown.value && 'disabled',
					]"
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
	<button
		@click="
			openPropertiesModal(props.ctx, props.container, props.obsidianApp)
		"
	>
		Sett
	</button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownPostProcessorContext, App, setIcon } from "obsidian";
// Import - Component
import CommentInput from "../Comment/CommentInput.vue";
import CommentList from "../Comment/CommentList.vue";
// Import - Func
import { displayCurrentTime, displayDuration } from "./LayoutSharedFunc";
import { togglePlayer, setPlayerPosition } from "../Logic/playerFunc";
import { openPropertiesModal } from "src/options";
// Import - Type
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
const playpause_btn = ref<HTMLElement | null>(null);
const showCommentInput_btn = ref<HTMLElement | null>(null);
const backward_btn = ref<HTMLElement | null>(null);
const forward_btn = ref<HTMLElement | null>(null);

onMounted(async () => {
	// Initialize icons
	if (playpause_btn.value) setIcon(playpause_btn.value, "play");
	if (showCommentInput_btn.value)
		setIcon(showCommentInput_btn.value, "bookmark-plus");
	if (backward_btn.value) setIcon(backward_btn.value, "chevrons-left");
	if (forward_btn.value) setIcon(forward_btn.value, "chevrons-right");

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
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

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
