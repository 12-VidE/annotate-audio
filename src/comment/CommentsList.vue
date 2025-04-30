<template>
	<div
		:class="['comment-list', sharedRefs.isCommentInputShown && 'disabled']"
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
			:maxDuration="sharedRefs.maxDuration"
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
import type { SharedRefs } from "src/types";
import type { AudioBoxOptions } from "src/options/optionsType";
// Import - Function
import { setPlayerPosition, pausePlayer, playPlayer } from "src/playerLogic";

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

const activeComment = ref<AudioComment | null>(null); // Closest comment before currentTime

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
	return comments.value.filter(
		(comment: AudioComment) =>
			comment.time >= options.value.chunk.startTime &&
			comment.time <= options.value.chunk.endTime
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
	if (!options.value.unstoppable)
		pausePlayer(props.player, sharedRefs.value.currentTime);

	sharedRefs.value.workingComment = getComment(time);

	// Trigger CommentInput.vue
	sharedRefs.value.isCommentInputShown = true;
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
		options.value.chunk,
		sharedRefs.value.currentTime,
		time
	);

	// Force play IF autoplay is enabled
	if (options.value.autoplay) {
		playPlayer(
			props.id,
			props.player,
			options.value.chunk,
			sharedRefs.value.currentTime
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
		(comment: AudioComment) => comment.time <= props.player.currentTime
	);
	activeComment.value = nextCommentToPlay[nextCommentToPlay.length - 1];
}
</script>
