<template>
	<div
		v-if="sharedRefs.isCommentInputShown.value"
		:class="['comment-input-container']"
	>
		<input
			type="text"
			ref="commentInput"
			v-model="sharedRefs.contentCommentInput.value"
			:class="[sharedRefs.isDuplicate.value && 'disabled']"
			@keydown.escape="imposeDefault"
			@keydown.enter="addComment"
		/>
		<!-- Buttons -->
		<div :class="['comment-btn-container']">
			<button
				ref="confirm_btn"
				:class="[sharedRefs.isDuplicate.value && 'disabled']"
				@click="addComment"
			></button>
			<button ref="cancel_btn" @click="imposeDefault"></button>
			<button
				v-if="sharedRefs.editMode.value"
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
	computed,
	onBeforeUnmount,
	onMounted,
	ref,
	useTemplateRef,
	watch,
} from "vue";
// Import - Type
import type { AudioComment } from "src/types";
import { SharedRefs } from "../sharedRefs";
// Import - Function
import { getCommentsArray } from "../sharedFunc";
import { pausePlayer } from "../Logic/playerFunc";
import { AudioBoxOptions } from "src/options";

const props = defineProps<{
	id: string;
	source: string;
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	audioSource: string;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
}>();

// UI
const confirm_btn = ref<HTMLElement | null>(null);
const cancel_btn = ref<HTMLElement | null>(null);
const delete_btn = ref<HTMLElement | null>(null);
const commentInputElement = useTemplateRef<HTMLInputElement>("commentInput");
props.sharedRefs.commentInput = computed(() => commentInputElement.value); // Expose input text

let deleteConfirmation = ref<boolean>(false); // IF the user confirm he wants to delete the comment
let workingTimestamp = ref<number | null>(null);
/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(() => {
	// Initilize Event-Listeners
	document.addEventListener("add-comment", eventInsertComment);
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	document.removeEventListener("add-comment", eventInsertComment);
});

// Use flag to trigger WHEN to show this input
watch(props.sharedRefs.isCommentInputShown, (value) => {
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
			props.source
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
	props.sharedRefs.isCommentInputShown.value = false;
	props.sharedRefs.editMode.value = false;
	props.sharedRefs.editedCommentTime.value = null;
	deleteConfirmation.value = false;
	props.sharedRefs.isDuplicate.value = false;
	props.sharedRefs.resume.value = true;
}
/**
 * (Re)write comment inside commentInputBox TO codeblock
 */
async function addComment(): Promise<void> {
	if (props.sharedRefs.contentCommentInput.value?.length == 0) return; // Empty input-box is useless

	const commentOnFocus: AudioComment = {
		time: props.sharedRefs.editMode.value
			? props.sharedRefs.editedCommentTime.value!
			: workingTimestamp.value!,
		content: props.sharedRefs.contentCommentInput.value!,
	};
	await editCodeblockComment(
		commentOnFocus,
		!props.sharedRefs.editMode.value
	);
}

function confirmDeleteComment() {
	if (!deleteConfirmation.value) {
		// 1°: Set the flag to show "Sure?" on the next click
		deleteConfirmation.value = true;
	} else {
		// 2°: Trigger the actual deletion if confirmed by the user
		deleteComment(props.sharedRefs.editedCommentTime.value!);
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
	// Save time
	workingTimestamp.value = Math.floor(props.player.currentTime);

	//Force state
	props.sharedRefs.isCommentInputShown.value = true;

	if (!props.options.unstoppable)
		pausePlayer(props.player, props.sharedRefs.currentTime);

	// "Wait" for it to open
	setTimeout(() => {
		// Initialize icons
		if (confirm_btn.value) setIcon(confirm_btn.value, "plus");
		if (cancel_btn.value) setIcon(cancel_btn.value, "x");
		if (delete_btn.value) setIcon(delete_btn.value, "trash-2");

		// Check IF it's a valid time
		const isNotUnique: boolean = getCommentsArray(props.source)?.some(
			(comment: AudioComment) => comment.time === workingTimestamp.value
		);
		if (props.sharedRefs.editMode.value) {
			if (confirm_btn.value) setIcon(confirm_btn.value, "check");
		} else if (isNotUnique) {
			// IF we want to create a new comment @time WHERE already 1 exits: don't allow it
			props.sharedRefs.contentCommentInput.value = "ALREADY EXISTS!";
			props.sharedRefs.isDuplicate.value = true;
		} else {
			props.sharedRefs.contentCommentInput.value = "";
			props.sharedRefs.commentInput.value?.focus();
		}
	}, 0);
}

function imposeDefault(): void {
	props.sharedRefs.contentCommentInput.value = "";
	props.sharedRefs.isDuplicate.value = false;
	props.sharedRefs.isCommentInputShown.value = false;
	props.sharedRefs.editMode.value = false;
}

/* ------------------------- */
/* --- Function ON Event --- */

const eventInsertComment = (e: Event) => {
	const event = e as CustomEvent;
	// Show THIS player commentInput
	if (event.detail?.id == props.id) showCommentInput();
};
</script>
