<template>
	<div class="layout--minimal">
		<div
			ref="stickyContainer"
			:class="['main-container', isSticky && 'is-sticky']"
		>
			<div :class="['inputs-container']">
				<!-- Controls -->
				<div
					:class="[
						'controls-container',
						isCommentInputShown && 'disabled',
					]"
				>
					<!-- Play/Pause Control -->
					<div
						ref="playpause_btn"
						:class="['playpause_btn']"
						@click="
							togglePlayer(
								props.ctx,
								props.container,
								props.player
							)
						"
					></div>
					<!-- Movement Controls -->
					<div :class="['movement-container']">
						<div
							ref="backward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(props.player, currentTime - 5)
							"
						></div>
						<div
							ref="forward_btn"
							:class="['movement-btn']"
							@click="
								setPlayerPosition(props.player, currentTime + 5)
							"
						></div>
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
				</div>
				<!-- Add Comment Control -->
				<div
					ref="showCommentInput_btn"
					:class="['commentInput_btn']"
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
import { onBeforeUnmount, onMounted, ref } from "vue";
import { MarkdownPostProcessorContext, App, setIcon, TFile } from "obsidian";
// Import - Component
import CommentInput from "../Comment/CommentInput.vue";
import CommentList from "../Comment/CommentList.vue";
// Import - Func
import { displayCurrentTime, displayDuration } from "./LayoutSharedFunc";
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
} from "../sharedRefs";

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

function onTimeBarInput() {
	// Validate and update the audio's current time
	if (!isNaN(currentTime.value) && props.player)
		props.player.currentTime = currentTime.value;
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
