import { MarkdownPostProcessorContext, App } from "obsidian";
// Import - Type
import type { AudioComment } from "./comment/commentType";

export type AudioChunk = {
	startTime: number;
	endTime: number;
	duration?: number;
};

export type AudioBoxParameters = {
	id: string;
	source: string;
	container: HTMLElement;
	audioSource: string | null;
	ctx: MarkdownPostProcessorContext;
	player: HTMLAudioElement;
	obsidianApp: App;
};

/* ------------------ */
/* --- SharedRefs --- */
/* ------------------ */

export interface SharedRefs {
	/* --- Player --- */
	srcPath: string; // Path to the audio source
	currentTime: number; // Time playing on the track
	maxDuration: number | undefined; // Total maximum duration of the track
	/* --- Comment --- */
	commentInput: HTMLInputElement | null; // HTML text input for the comment input
	workingComment: AudioComment | null;
	/* --- States --- */
	isCommentInputShown: boolean; // IF the input-box for a comment is displayed
	resume: boolean; // IF the player should resume after the re-render
}

export const DEFAULT_SHARED_REFS: SharedRefs = {
	srcPath: "",
	currentTime: 0,
	maxDuration: undefined,

	commentInput: null,
	workingComment: null,

	isCommentInputShown: false,
	resume: false,
};
