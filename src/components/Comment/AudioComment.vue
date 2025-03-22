<template>
	<div
		class="comment"
		@click.left="emitPlayFrom"
		@click.right="emitEditComment"
	>
		<span class="comment-time">{{ displayCommentTime }}</span>
		<span class="comment-content" v-html="displayCommentContent"></span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { secondsToTime } from "src/utils";
import { MarkdownRenderer, Component, App } from "obsidian";
import type { AudioComment } from "src/types";

const props = defineProps<{
	comment: AudioComment;
	obsidianApp: App;
}>();

const emit = defineEmits<{
	(event: "play-from", time: number): void;
	(event: "edit-comment", time: number): void;
}>();

/* ---------------- */
/* --- Computed --- */
/* ---------------- */
const displayCommentTime = computed(() => {
	return secondsToTime(props.comment.time);
});
const displayCommentContent = computed(() => {
	const temporaryContainer = document.createElement("div");
	const temporaryComponent = new Component();
	// Render markdown into the container element:
	MarkdownRenderer.render(
		props.obsidianApp,
		props.comment.content,
		temporaryContainer,
		"",
		temporaryComponent
	);
	temporaryComponent.unload();
	return temporaryContainer.innerHTML || "";
});

/* --------------- */
/* --- Methods --- */
/* --------------- */
function emitPlayFrom(): void {
	emit("play-from", props.comment.time);
}
function emitEditComment(): void {
	emit("edit-comment", props.comment.time);
}
</script>
