import { MarkdownPostProcessorContext, App } from "obsidian";
// Import - Type
import type { AudioComment } from "./comment/commentType";
import { AudioBoxOptions } from "./options/optionsType";

export type AudioChunk = {
	startTime: number;
	endTime: number;
};

export type AudioBoxParameters = {
	id: string;
	source: string;
	container: HTMLElement;
	audioSource: string | null;
	ctx: MarkdownPostProcessorContext;
	player: HTMLAudioElement;
	obsidianApp: App;
	sharedRefs: SharedRefs;
	options: AudioBoxOptions;
	comments: AudioComment[];
};

/* ------------------ */
/* --- SharedRefs --- */
/* ------------------ */

export interface SharedRefs {
	/* --- Player --- */
	currentTime: number; // Time playing on the track
	maxDuration: number | undefined; // Total maximum duration of the track
	/* --- Comment --- */
	commentInput: HTMLInputElement | null; // HTML text input for the comment input
	workingComment: AudioComment | null;
	/* --- States --- */
	isCommentInputShown: boolean; // IF the input-box for a comment is displayed
}

export const DEFAULT_SHARED_REFS: SharedRefs = {
	currentTime: 0,
	maxDuration: undefined,

	commentInput: null,
	workingComment: null,

	isCommentInputShown: false,
};
