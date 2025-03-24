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
			@play-from="
				(time) =>
					setPlayerPosition(
						player,
						sharedRefs.chunk.value,
						sharedRefs.currentTime,
						time
					)
			"
			@edit-comment="enableEditMode"
			:comment="comment"
			:obsidianApp="obsidianApp"
			:key="comment.time"
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
import { setPlayerPosition, pausePlayer } from "../Logic/playerFunc";

const props = defineProps<{
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
}>();

const activeComment = ref<AudioComment | null>(null); //

onMounted(() => {
	// Initialize Event-Listeners
	if (props.player)
		props.player.addEventListener("timeupdate", eventActiveComment);

	/* logRefs(props.sharedRefs); */
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * @returns Comments inside the chunk (CANNOT do it inside getCommentsArray otherwise it's difficult to add comment)
 */
const filteredCommentList = computed(() => {
	return getCommentsArray(props.ctx, props.container).filter(
		(comment: AudioComment) =>
			comment.time >= props.sharedRefs.chunk.value?.startTime! &&
			comment.time <= props.sharedRefs.chunk.value?.endTime!
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

	pausePlayer(
		props.ctx,
		props.container,
		props.player,
		props.sharedRefs.chunk.value,
		props.sharedRefs.currentTime
	);

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
	const commentsArray = getCommentsArray(props.ctx, props.container);
	const commentIndex: number = commentsArray.findIndex(
		(item: AudioComment) => time == item.time
	);
	return commentsArray[commentIndex] || null;
}

/* ------------------------- */
/* --- Function ON Event --- */

/**
 * Find whose the comment we are reproducing
 */
function eventActiveComment() {
	// Find activeComment
	const nextCommentToPlay = getCommentsArray(
		props.ctx,
		props.container
	).filter(
		(comment: AudioComment) => props.player?.currentTime >= comment.time
	);
	activeComment.value = nextCommentToPlay[nextCommentToPlay.length - 1];
}
</script>
