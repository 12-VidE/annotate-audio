<template>
	<div
		v-if="sharedRefs.isCommentInputShown"
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
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
// Import - Type
import type { AudioComment } from "./commentType";
import type { SharedRefs } from "src/types";
import type { AudioBoxOptions } from "src/options/optionsType";
// Import - Function
import { pausePlayer, playPlayer } from "src/playerLogic";
import { initIcon } from "src/utils";

const props = defineProps<{
	id: string;
	player: HTMLAudioElement;
}>();

const sharedRefs = defineModel<SharedRefs>("sharedRefs", { required: true });
const options = defineModel<AudioBoxOptions>("options", { required: true });
const comments = defineModel<AudioComment[]>("comments", {
	required: true,
});

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
let resume = ref<boolean>(false); // IF the player should resume after the re-render

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
	() => sharedRefs.value.isCommentInputShown,
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
	if (!props.player.paused) resume.value = true;

	if (!options.value.unstoppable)
		pausePlayer(props.player, sharedRefs.value.currentTime);

	// "Wait" for it to open to render
	await nextTick(() => {
		if (sharedRefs.value.workingComment?.content) {
			// "Editing" mode = IF there's already some content
			isEdit.value = true;

			// Initialize buttons
			initIcon(confirm_btn.value, "check", "Confirm");
			initIcon(cancel_btn.value, "x", "Cancel");
			initIcon(delete_btn.value, "trash-2", "Delete");
		} else {
			// "Adding" mode = IF there's no content
			sharedRefs.value.workingComment = {
				time: Math.floor(props.player.currentTime), // Save it in case of "unstoppable"
				content: "",
			};

			// Initialize buttons
			initIcon(confirm_btn.value, "plus", "Add");
			initIcon(cancel_btn.value, "x", "Cancel");

			// Check IF it's a valid time = IF it's unique
			const isNotUnique: boolean = comments.value.some(
				(comment: AudioComment) =>
					comment.time === sharedRefs.value.workingComment?.time
			);
			if (isNotUnique) {
				// IF we want to create a new comment @time WHERE already 1 exits: don't allow it
				isDuplicate.value = true;

				sharedRefs.value.workingComment.content = "ALREADY EXISTS!";
			} else {
				// IF we want to create a new comment... nothing
			}
		}

		// Populate input text
		commentInputBox.value = sharedRefs.value.workingComment?.content!;

		// Scroll + Focus contentCommentInput (IF sticky, it gets sluggish)
		if (!options.value.sticky) {
			commentInputElement.value?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
		commentInputElement.value?.focus({ preventScroll: true });
	});
}

/**
 * (Re)write comment inside commentInputBox TO codeblock
 */
async function addComment(): Promise<void> {
	if (commentInputBox.value !== "" && sharedRefs.value.workingComment) {
		sharedRefs.value.workingComment.content = commentInputBox.value;
		if (isEdit.value) {
			// WHEN modifing an existing comment
			const indexCommentToEdit = comments.value.findIndex(
				(comment) =>
					comment.time === sharedRefs.value.workingComment?.time
			);
			// IF exists, update the content
			if (indexCommentToEdit !== -1)
				comments.value[indexCommentToEdit].content =
					sharedRefs.value.workingComment.content;
		} else {
			// WHEN adding a new comment
			comments.value.push(sharedRefs.value.workingComment);
			comments.value.sort(
				(x: AudioComment, y: AudioComment) => x.time - y.time
			);
		}
	}
	imposeDefault();
}

async function confirmDeleteComment() {
	if (!deleteConfirmation.value) {
		// 1°: Set the flag to take confirmation on the next click
		deleteConfirmation.value = true;
	} else {
		// 2°: Trigger the actual deletion if confirmed by the user
		if (sharedRefs.value.workingComment) {
			sharedRefs.value.workingComment.content = "";
			const indexCommentToDelete = comments.value.findIndex(
				(comment) =>
					comment.time === sharedRefs.value.workingComment?.time
			);
			if (indexCommentToDelete !== -1)
				comments.value.splice(indexCommentToDelete, 1);
		}
		imposeDefault();
	}
}

function imposeDefault(): void {
	// Resume player IF it was playing before interacting w/ a comment
	if (resume.value && !options.value.unstoppable)
		playPlayer(
			props.id,
			props.player,
			options.value.chunk,
			sharedRefs.value.currentTime
		);

	// Reset states
	commentInputBox.value = "";

	isDuplicate.value = false;
	isEdit.value = false;
	resume.value = false;

	sharedRefs.value.isCommentInputShown = false;
	sharedRefs.value.workingComment = null;
}

/* ------------------------- */
/* --- Function ON Event --- */

const eventAddComment = (e: Event) => {
	const event = e as CustomEvent;
	// Show THIS player commentInput
	if (event.detail?.id == props.id)
		sharedRefs.value.isCommentInputShown = true;
};
</script>
