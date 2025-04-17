<template>
	<div
		v-if="sharedRefs.isCommentInputShown.value"
		:class="['comment-input-container']"
	>
		<input
			type="text"
			ref="commentInputElement"
			v-model.trim="commentInputBox"
			:disabled="isDuplicate"
			@keydown.escape="imposeDefault"
			@keydown.enter="addComment"
		/>
		<!-- Buttons -->
		<div :class="['comment-btn-container']">
			<!-- Confirm -->
			<button
				type="button"
				ref="confirm_btn"
				:disabled="!commentInputBox || isDuplicate"
				@click="addComment"
			></button>
			<!-- Cancel -->
			<button
				type="button"
				ref="cancel_btn"
				@click="imposeDefault"
			></button>
			<!-- Delete -->
			<button
				type="button"
				v-show="isEdit"
				ref="delete_btn"
				:class="{ 'delete-confirmation': deleteConfirmation }"
				@click="confirmDeleteComment"
			></button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { MarkdownPostProcessorContext, App, TFile } from "obsidian";
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
// Import - Type
import type { AudioComment } from "./commentType";
import type { SharedRefs } from "src/components/sharedRefs";
import type { AudioBoxOptions } from "src/options";
// Import - Function
import { getCommentsArray } from "./commentLogic";
import { pausePlayer } from "src/components/Logic/playerFunc";
import { initButton } from "src/utils";

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

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

// UI
const confirm_btn = ref<HTMLElement | null>(null);
const cancel_btn = ref<HTMLElement | null>(null);
const delete_btn = ref<HTMLElement | null>(null);
const commentInputElement = ref<HTMLInputElement | null>(null);
let commentInputBox = ref<string>(""); // Text content of "commentInputElement"
// Flags
let deleteConfirmation = ref<boolean>(false); // IF the user confirm he wants to delete the comment
let isDuplicate = ref<boolean>(false); // WHEN we want to create a comment WHERE it already exists
let isEdit = ref<boolean>(false); // IF we are editing a comment (NOT creating a new one)

onMounted(() => {
	// Initilize Event-Listeners
	document.addEventListener("add-comment", eventAddComment);
});

onBeforeUnmount(() => {
	// Destroy Event-Listeners
	document.removeEventListener("add-comment", eventAddComment);
});

// Trigger to show this input
watch(
	() => props.sharedRefs.isCommentInputShown.value,
	(show) => {
		if (show) showCommentInput();
	}
);

/* ----------------- */
/* --- Functions --- */
/* ----------------- */

/**
 * Display the commnet input box
 */
async function showCommentInput(): Promise<void> {
	if (!props.options.unstoppable)
		pausePlayer(props.player, props.sharedRefs.currentTime);

	// "Wait" for it to open to render
	await nextTick(() => {
		if (props.sharedRefs.workingComment.value?.content) {
			// "Editing" mode = IF there's already some content
			isEdit.value = true;

			// Initialize buttons
			initButton(confirm_btn.value, "check", "Confirm");
			initButton(cancel_btn.value, "x", "Cancel");
			initButton(delete_btn.value, "trash-2", "Delete");
		} else {
			// "Adding" mode = IF there's no content
			props.sharedRefs.workingComment.value = {
				time: Math.floor(props.player.currentTime), // Save it in case of "unstoppable"
				content: "",
			};

			// Initialize buttons
			initButton(confirm_btn.value, "plus", "Add");
			initButton(cancel_btn.value, "x", "Cancel");

			// Check IF it's a valid time = IF it's unique
			const isNotUnique: boolean = getCommentsArray(props.source)?.some(
				(comment: AudioComment) =>
					comment.time === props.sharedRefs.workingComment.value?.time
			);
			if (isNotUnique) {
				// IF we want to create a new comment @time WHERE already 1 exits: don't allow it
				isDuplicate.value = true;

				props.sharedRefs.workingComment.value.content =
					"ALREADY EXISTS!";
			} else {
				// IF we want to create a new comment... nothing
			}
		}

		// Populate input text
		commentInputBox.value = props.sharedRefs.workingComment.value?.content!;

		// Scroll + Focus contentCommentInput (IF sticky, it gets sluggish)
		if (!props.options.sticky) {
			commentInputElement.value?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
		commentInputElement.value?.focus({ preventScroll: true });
	});
}

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
}
/**
 * (Re)write comment inside commentInputBox TO codeblock
 */
async function addComment(): Promise<void> {
	if (commentInputBox.value !== "" && props.sharedRefs.workingComment.value) {
		props.sharedRefs.workingComment.value.content = commentInputBox.value;
		await editCodeblockComment(
			props.sharedRefs.workingComment.value,
			!isEdit.value
		);
	}
	imposeDefault();
}

async function confirmDeleteComment() {
	if (!deleteConfirmation.value) {
		// 1°: Set the flag to take confirmation on the next click
		deleteConfirmation.value = true;
	} else {
		// 2°: Trigger the actual deletion if confirmed by the user
		if (props.sharedRefs.workingComment.value) {
			props.sharedRefs.workingComment.value.content = "";
			await editCodeblockComment(
				props.sharedRefs.workingComment.value,
				false
			);
		}
		imposeDefault();
	}
}

function imposeDefault(): void {
	commentInputBox.value = "";

	isDuplicate.value = false;
	isEdit.value = false;

	props.sharedRefs.isCommentInputShown.value = false;
	props.sharedRefs.workingComment.value = null;
}

/* ------------------------- */
/* --- Function ON Event --- */

const eventAddComment = (e: Event) => {
	const event = e as CustomEvent;
	// Show THIS player commentInput
	if (event.detail?.id == props.id)
		props.sharedRefs.isCommentInputShown.value = true;
};
</script>
