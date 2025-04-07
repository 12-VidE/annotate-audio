import { ref, Ref } from "vue";

export interface SharedRefs {
	/* -------------- */
	/* --- Player --- */
	/* -------------- */
	srcPath: Ref<string>; // Path to the audio source
	currentTime: Ref<number>; // Time playing on the track
	maxDuration: Ref<number | undefined>; // Total maximum duration of the track

	/* --------------- */
	/* --- Comment --- */
	/* --------------- */
	commentInput: Ref<HTMLInputElement | null>; // HTML text input for the comment input
	editedCommentTime: Ref<number | null>; // Time (=index) of the comment to edit
	contentCommentInput: Ref<string>; // Content of input-box WHEN creating/modififing comment

	/* -------------- */
	/* --- States --- */
	/* -------------- */
	isDuplicate: Ref<boolean>; // WHEN we want to create a comment WHERE it already exists
	editMode: Ref<boolean>; // IF we are editing a comment (NOT creating a new one)
	isCommentInputShown: Ref<boolean>; // IF the input-box for a comment is displayed
	resume: Ref<boolean>; // IF the player should resume after the re-render
}
/**
 * Create the (initialized) necessary refs for each codeblock that are shared between components
 * @returns
 */
export function createShareRefs(): SharedRefs {
	return {
		srcPath: ref(""),
		currentTime: ref(0),
		maxDuration: ref(undefined),

		commentInput: ref(null),
		editedCommentTime: ref(null),
		contentCommentInput: ref(""),

		isDuplicate: ref(false),
		editMode: ref(false),
		isCommentInputShown: ref(false),
		resume: ref(false),
	};
}
