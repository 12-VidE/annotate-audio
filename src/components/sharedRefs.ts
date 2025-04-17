import { AudioComment } from "src/comment/commentType";
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
	workingComment: Ref<AudioComment | null>;

	/* -------------- */
	/* --- States --- */
	/* -------------- */
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
		workingComment: ref(null),

		isCommentInputShown: ref(false),
		resume: ref(false),
	};
}
