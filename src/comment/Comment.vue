<template>
	<div
		class="comment"
		@click.left="emitPlayFrom"
		@click.right="emitEditComment"
	>
		<span class="comment-time">{{
			secondsToTime(comment.time, maxDuration)
		}}</span>
		<span class="comment-content" v-html="displayCommentContent"></span>
		<button
			type="button"
			v-if="Platform.isMobile"
			ref="edit_btn"
			class="strip-native"
			@click.stop="emitEditComment"
		></button>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { MarkdownRenderer, Component, App, Platform } from "obsidian";
// Import - Type
import type { AudioComment } from "./commentType";
// Import - Function
import { initButton, secondsToTime } from "src/utils";

const props = defineProps<{
	comment: AudioComment;
	obsidianApp: App;
	maxDuration: number | undefined;
}>();

const emit = defineEmits<{
	(event: "play-from", time: number): void;
	(event: "edit-comment", time: number): void;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

// UI
const edit_btn = ref<HTMLElement | null>(null);

onMounted(() => {
	// Initialize icons
	initButton(edit_btn.value, "pencil", "Edit");
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

/**
 * Markdown rendered comment content
 */
const displayCommentContent = computed(() => {
	// Create temporary container to render markdown inside
	const temporaryContainer = document.createElement("div");
	const temporaryComponent = new Component();
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

/* ------------ */
/* --- Emit --- */
/* ------------ */
function emitPlayFrom(): void {
	emit("play-from", props.comment.time);
}
function emitEditComment(): void {
	emit("edit-comment", props.comment.time);
}
</script>
