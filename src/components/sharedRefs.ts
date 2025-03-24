import { ref, Ref } from "vue";
import type { AudioChunk } from "src/types";

export interface SharedRefs {
	/* -------------- */
	/* --- Player --- */
	/* -------------- */
	srcPath: Ref<string>; // Path to the audio source
	currentTime: Ref<number>; // Time playing on the track
	chunk: Ref<AudioChunk | undefined>; // Portion of track to be reproduced

	/* --------------- */
	/* --- Comment --- */
	/* --------------- */
	commentInput: Ref<HTMLInputElement | null>; // HTML text input for the comment input
	editedCommentTime: Ref<number | null>; // Time (=index) of the comment to edit
	contentCommentInput: Ref<string>; // Content of input-box WHEN creating/modififing comment

	/* -------------- */
	/* --- States --- */
	/* -------------- */
	isSticky: Ref<boolean>; // IF we enable the player to be sticky
	isAutoplay: Ref<boolean>; // WHEN clicking on a comment, the playes does NOT pause
	isDuplicate: Ref<boolean>; // WHEN we want to create a comment WHERE it already exists
	deleteConfirmation: Ref<boolean>; // IF the user confirm he wants to delete the comment
	editMode: Ref<boolean>; // IF we are editing a comment (NOT creating a new one)
	isCommentInputShown: Ref<boolean>; // IF the input-box for a comment is displayed
	isCached: Ref<boolean>; // IF we can used the chached value CAUSE the we are dealing with the same obj
}

/**
 * Create the (initialized) necessary refs for each codeblock that are shared between components
 * @returns
 */
export function createShareRefs(): SharedRefs {
	return {
		srcPath: ref(""),
		currentTime: ref(0),
		chunk: ref(undefined),

		commentInput: ref(null),
		editedCommentTime: ref(null),
		contentCommentInput: ref(""),

		isSticky: ref(false),
		isAutoplay: ref(false),
		isDuplicate: ref(false),
		deleteConfirmation: ref(false),
		editMode: ref(false),
		isCommentInputShown: ref(false),
		isCached: ref(false),
	};
}
