<template>
	<div
		:class="[
			'comment-list',
			sharedRefs.isCommentInputShown.value && 'disabled',
		]"
	>
		<AudioCommentVue
			v-for="comment in filteredCommentList"
			:class="{
				'active-comment': comment.time === activeComment?.time,
			}"
			@play-from="(time) => playComment(time)"
			@edit-comment="enableEditMode"
			:key="comment.time"
			:comment="comment"
			:obsidianApp="obsidianApp"
			:sharedRefs="sharedRefs"
		/>
	</div>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App } from "obsidian";
import { ref, computed, nextTick, onMounted } from "vue";
// Import - Component
import AudioCommentVue from "./AudioComment.vue";
// Import - Type
import type { AudioComment } from "src/types";
import { SharedRefs } from "../sharedRefs";

// Import - Function
import { getCommentsArray, logRefs } from "../sharedFunc";
import {
	setPlayerPosition,
	pausePlayer,
	playPlayer,
} from "../Logic/playerFunc";
import { AudioBoxOptions } from "src/options";

const props = defineProps<{
	id: string;
	source: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
}>();

const activeComment = ref<AudioComment | null>(null); // Closest comment before currentTime

const commentsList = getCommentsArray(props.source);
/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(() => {
	// Initialize Event-Listeners
	if (props.player)
		props.player.addEventListener("timeupdate", eventActiveComment);

	/* logRefs(props.sharedRefs); */
});

/**
 * List of comments inside chunk
 * "computed" CAUSE it interacts w/ chunk
 */
const filteredCommentList = computed(() => {
	return commentsList.filter(
		(comment: AudioComment) =>
			comment.time >= props.options.chunk.startTime &&
			comment.time <= props.options.chunk.endTime
	);
});

/* ----------------- */
/* --- Functions --- */
/* ----------------- */

/**
 * Enable editing on a comment
 * @param time - Index of comment to edit
 */
function enableEditMode(time: number): void {
	// Set states
	props.sharedRefs.isCommentInputShown.value = true;
	props.sharedRefs.editMode.value = true;
	props.sharedRefs.editedCommentTime.value = time;

	if (!props.options.unstoppable)
		pausePlayer(props.player, props.sharedRefs.currentTime);

	props.sharedRefs.contentCommentInput.value = getComment(time)!.content;

	nextTick(() => {
		// Scroll contentCommentInput into view
		props.sharedRefs.commentInput.value?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
		// Delay focusing until the scrolling completes
		setTimeout(() => {
			props.sharedRefs.commentInput.value?.focus();
		}, 300);
	});
}

/**
 * @param time - index
 * @returns the comment @ that time
 */
function getComment(time: number): AudioComment | null {
	const commentIndex: number = filteredCommentList.value.findIndex(
		(item: AudioComment) => time == item.time
	);
	return filteredCommentList.value.at(commentIndex) || null;
}

function playComment(time: number): void {
	setPlayerPosition(
		props.player,
		props.options.chunk,
		props.sharedRefs.currentTime,
		time
	);

	// Force play IF autoplay is enabled
	if (props.options.autoplay) {
		playPlayer(
			props.id,
			props.player,
			props.options.chunk,
			props.sharedRefs.currentTime.value
		);
	}
}

/* ------------------------- */
/* --- Function ON Event --- */

/**
 * Find whose the comment we are reproducing
 */
function eventActiveComment() {
	// Find activeComment
	const nextCommentToPlay = filteredCommentList.value.filter(
		(comment: AudioComment) => props.player?.currentTime >= comment.time
	);
	activeComment.value = nextCommentToPlay[nextCommentToPlay.length - 1];
}
</script>
