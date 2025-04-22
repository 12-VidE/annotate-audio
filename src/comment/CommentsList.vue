<template>
	<div
		:class="[
			'comment-list',
			sharedRefs.isCommentInputShown.value && 'disabled',
		]"
	>
		<Comment
			v-for="comment in filteredCommentsArray"
			:class="{
				'active-comment': comment.time === activeComment?.time,
			}"
			@play-from="(time : number) => playComment(time)"
			@edit-comment="enableEditComment"
			:key="comment.time + '_' + comment.content"
			:comment="comment"
			:obsidianApp="obsidianApp"
			:maxDuration="sharedRefs.maxDuration.value"
		/>
	</div>
</template>

<script setup lang="ts">
import { App } from "obsidian";
import { ref, computed, onMounted } from "vue";
// Import - Component
import Comment from "./Comment.vue";
// Import - Type
import type { AudioComment } from "./commentType";
import { SharedRefs } from "src/components/sharedRefs";

// Import - Function
import { getCommentsArray } from "./commentLogic";
import { setPlayerPosition, pausePlayer, playPlayer } from "src/playerLogic";
import { AudioBoxOptions } from "src/options/options";

const props = defineProps<{
	id: string;
	source: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

const activeComment = ref<AudioComment | null>(null); // Closest comment before currentTime
const commentsArray: AudioComment[] = getCommentsArray(props.source);

onMounted(() => {
	// Initialize Event-Listeners
	if (props.player)
		props.player.addEventListener("timeupdate", eventActiveComment);
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * List of comments inside chunk
 */
const filteredCommentsArray = computed(() => {
	return commentsArray.filter(
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
function enableEditComment(time: number): void {
	if (!props.options.unstoppable)
		pausePlayer(props.player, props.sharedRefs.currentTime);

	props.sharedRefs.workingComment.value = getComment(time);

	// Trigger CommentInput.vue
	props.sharedRefs.isCommentInputShown.value = true;
}

/**
 * @param time - index
 * @returns the comment @ that time
 */
function getComment(time: number): AudioComment | null {
	const commentIndex: number = filteredCommentsArray.value.findIndex(
		(item: AudioComment) => time == item.time
	);
	return filteredCommentsArray.value.at(commentIndex) || null;
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
 * Find who's the comment we are reproducing
 */
function eventActiveComment() {
	// Find activeComment
	const nextCommentToPlay = filteredCommentsArray.value.filter(
		(comment: AudioComment) => props.player?.currentTime >= comment.time
	);
	activeComment.value = nextCommentToPlay[nextCommentToPlay.length - 1];
}
</script>
