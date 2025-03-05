<template>
	<div
		class="comment"
		@click.left="emitPlayFrom"
		@click.right="emitEditComment"
	>
		<span class="comment-time">{{ commentTime }}</span>
		<span class="comment-content" v-html="commentContent"></span>
	</div>
</template>

<script lang="ts">
import { secondsToTime } from "src/utils";
import { MarkdownRenderer, Component, App } from "obsidian";
import { defineComponent, PropType } from "vue";
import type { AudioComment } from "../types";

export default defineComponent({
	name: "AudioComment",
	props: {
		comment: {
			type: Object as PropType<AudioComment>,
			required: true,
		},
		obsidianApp: {
			type: Object as PropType<App>,
			required: true,
		},
	},
	computed: {
		commentTime() {
			return secondsToTime(this.comment.time);
		},
		commentContent() {
			const temporaryContainer = document.createElement("div");
			const temporaryComponent = new Component();
			// Render markdown into the container element
			MarkdownRenderer.render(
				this.obsidianApp,
				this.comment.content,
				temporaryContainer,
				"",
				temporaryComponent
			);
			temporaryComponent.unload();
			// Update the reactive property with the rendered HTML
			return temporaryContainer.innerHTML || "";
		},
	},
	methods: {
		emitPlayFrom(): void {
			this.$emit("play-from", this.comment.time);
		},
		emitEditComment(): void {
			this.$emit("edit-comment", this.comment.time);
		},
	},
});
</script>
