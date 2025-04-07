<template>
	<div
		class="comment"
		@click.left="emitPlayFrom"
		@click.right="emitEditComment"
	>
		<span class="comment-time">{{
			secondsToTime(comment.time, sharedRefs.maxDuration.value)
		}}</span>
		<span class="comment-content" v-html="displayCommentContent"></span>
		<i
			v-if="Platform.isMobile"
			ref="edit_btn"
			@click.stop="emitEditComment"
		></i>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { MarkdownRenderer, Component, App, Platform, setIcon } from "obsidian";
// Import - Function
import { secondsToTime } from "src/utils";
// Import - Type
import type { AudioComment } from "src/types";
import type { SharedRefs } from "../sharedRefs";
// UI
const edit_btn = ref<HTMLElement | null>(null);

const props = defineProps<{
	comment: AudioComment;
	obsidianApp: App;
	sharedRefs: SharedRefs;
}>();

const emit = defineEmits<{
	(event: "play-from", time: number): void;
	(event: "edit-comment", time: number): void;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(() => {
	// Initialize icons
	if (edit_btn.value) setIcon(edit_btn.value, "pencil");
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
