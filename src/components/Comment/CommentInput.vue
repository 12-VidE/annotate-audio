<template>
	<div v-if="isCommentInputShown" :class="['comment-input-container']">
		<input
			type="text"
			ref="commentInput"
			v-model="contentCommentInput"
			:class="[isDuplicate && 'disabled']"
			@keydown.escape="imposeDefault"
			@keydown.enter="addComment"
		/>
		<div :class="['comment-btn-container']">
			<button
				ref="confirm_btn"
				:class="[isDuplicate && 'disabled']"
				@click="addComment"
			></button>
			<button ref="cancel_btn" @click="imposeDefault"></button>
			<button
				v-if="editMode"
				ref="delete_btn"
				@click="confirmDeleteComment"
				:style="{
					'background-color': deleteConfirmation
						? 'var(--interactive-accent)'
						: '',
				}"
			></button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile, setIcon } from "obsidian";
import {
	inject,
	onMounted,
	provide,
	Ref,
	ref,
	useTemplateRef,
	watch,
} from "vue";
// Import - Type
import type { AudioComment } from "src/types";
// Import - Ref
import {
	isCommentInputShown,
	editMode,
	deleteConfirmation,
	isDuplicate,
	currentTime,
	editedCommentTime,
	contentCommentInput,
	commentInput,
} from "../sharedRefs";
// Import - Function
import { getCommentsArray } from "../sharedFunc";
import { pausePlayer } from "../Logic/playerFunc";

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
const confirm_btn = ref<HTMLElement | null>(null);
const cancel_btn = ref<HTMLElement | null>(null);
const delete_btn = ref<HTMLElement | null>(null);
const commentInputX = useTemplateRef<HTMLInputElement>("commentInput");

onMounted(() => {
	// Expose input text
	commentInput.value = commentInputX.value;
});
watch(isCommentInputShown, (value) => {
	if (value) showCommentInput();
});

/* ----------------- */
/* --- Functions --- */
/* ----------------- */

/**
 * Function that actually operate on codeblock
 * (Re)Writing/Cancelling 1 comment
 * @param commentOnFocus Comment to work with. If .content = empty → It deletes the comment
 * @param isNew True: dealing w/ a new comment | False: dealing w/ an already existsing comment
 */
async function editCodeblockComment(
	commentOnFocus: AudioComment,
	isNew: boolean
) {
	if (commentOnFocus.content == "" && isNew) {
		// Impossible state: are we deleting OR creating a comment?
		console.error("Impossible state reached WHEN dealing with comment");
		return;
	}

	// Get file full content
	const sectionInfo = props.ctx.getSectionInfo(props.container);
	if (!sectionInfo) {
		return;
	}
	const lines = sectionInfo.text.split("\n");

	try {
		const commentsArray: Array<AudioComment> = getCommentsArray(
			props.ctx,
			props.container
		);
		let commentOnFocusIndex: number; // WHERE we will place the new/modified comment (to preserve cronological order). 0 = 1° comment

		if (isNew) {
			// WHEN we need to add a new comment
			if (!commentsArray)
				commentOnFocusIndex = 0; // IF we are adding the 1° comment
			else {
				commentOnFocusIndex = commentsArray.findIndex(
					(item: AudioComment) => commentOnFocus.time < item.time
				);
				if (commentOnFocusIndex === -1)
					commentOnFocusIndex = commentsArray.length; // IF it doesn't find a place: it's the last
			}
		} else {
			// WHEN we need to modify/cancel an existing comment
			commentOnFocusIndex = commentsArray.findIndex(
				(item: AudioComment) => commentOnFocus.time === item.time
			);
			if (commentOnFocusIndex == -1) {
				// IF it doesn't find the comment, there must be an error: the comment must exists!
				console.error("Trying to edit a non-existing comment");
				return;
			}
		}

		const commentOnFocusAbsoluteLine =
			sectionInfo.lineEnd - commentsArray.length + commentOnFocusIndex; // Line WHERE the comment is place inside the entire file

		// Check IF it's within bounds
		if (
			commentOnFocusAbsoluteLine <
				sectionInfo.lineEnd - commentsArray.length ||
			commentOnFocusAbsoluteLine > sectionInfo.lineEnd
		)
			return;

		// Implement change into file
		lines.splice(
			commentOnFocusAbsoluteLine,
			isNew ? 0 : 1,
			...(commentOnFocus.content == ""
				? [] // IF deleting
				: [`${commentOnFocus.time} --- ${commentOnFocus.content}`]) // IF adding/modifying
		);

		// Get file & write the changes to it
		const file = props.obsidianApp.vault.getAbstractFileByPath(
			props.ctx.sourcePath
		);
		if (!file || !(file instanceof TFile)) return;
		await props.obsidianApp.vault.modify(file, lines.join("\n"));
	} catch (error) {
		console.error("Cannot manage comment - ", error);
	}

	// Impose default states
	isCommentInputShown.value = false;
	editMode.value = false;
	editedCommentTime.value = null;
	deleteConfirmation.value = false;
	isDuplicate.value = false;
}
/**
 * (Re)write comment inside commentInputBox TO codeblock
 */
async function addComment(): Promise<void> {
	if (contentCommentInput.value?.length == 0) return; // Empty input-box is useless

	const commentOnFocus: AudioComment = {
		time: editMode.value
			? editedCommentTime.value!
			: Math.floor(currentTime.value),
		content: contentCommentInput.value!,
	};
	await editCodeblockComment(commentOnFocus, !editMode.value);
}

function confirmDeleteComment() {
	if (!deleteConfirmation.value) {
		// 1°: Set the flag to show "Sure?" on the next click
		deleteConfirmation.value = true;
	} else {
		// 2°: Trigger the actual deletion if confirmed by the user
		deleteComment(editedCommentTime.value!);
	}
}
async function deleteComment(time: number) {
	const commentOnFocus: AudioComment = {
		time: time,
		content: "",
	};
	await editCodeblockComment(commentOnFocus, false);
}

function showCommentInput(): void {
	pausePlayer(props.ctx, props.container, props.player);

	setTimeout(() => {
		// Initialize icons
		if (confirm_btn.value) setIcon(confirm_btn.value, "plus");
		if (cancel_btn.value) setIcon(cancel_btn.value, "x");
		if (delete_btn.value) setIcon(delete_btn.value, "trash-2");

		// Check IF it's a valid time
		const isNotUnique: boolean = getCommentsArray(
			props.ctx,
			props.container
		)?.some(
			(comment: AudioComment) =>
				comment.time === Math.floor(currentTime.value)
		);
		if (editMode.value) {
			if (confirm_btn.value) setIcon(confirm_btn.value, "check");
		} else if (isNotUnique) {
			// IF we want to create a new comment @time WHERE already 1 exits: don't allow it
			contentCommentInput.value = "ALREADY EXISTS!";
			isDuplicate.value = true;
		} else {
			// Focus on commentInputBox
			commentInput.value?.focus();
		}
	}, 0);
}

function imposeDefault(): void {
	contentCommentInput.value = "";
	isDuplicate.value = false;
	isCommentInputShown.value = false;
	editMode.value = false;
}
</script>
