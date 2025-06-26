// Import - Type
import type { AudioChunk } from "src/types";

// What can be changed inside audio-box
export type AudioBoxOptions = {
	source: string;
	//Player
	chunk: AudioChunk; // Portion of track to be reproduced
	volume: number; // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume
	speed: number; // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
	loop: boolean;
	// UI
	layout: number;
	sticky: boolean; // IF we enable the player to be sticky
	title: string | undefined;
	decimals: number; // How many decimals of time (btw 0-2) to show
	// Comments
	autoplay: boolean; // WHEN clicking on a comment, the playes does NOT pause
	unstoppable: boolean; // Player doesn't stop WHEN adding a comment
};

export const DEFAULT_AUDIOBOX_OPTIONS: AudioBoxOptions = {
	source: "",
	// Player
	chunk: { startTime: 0, endTime: 0 },
	volume: 0.5,
	speed: 1,
	loop: false,
	// UI
	layout: 0,
	sticky: false,
	title: undefined,
	decimals: 0,
	// Comments
	autoplay: false,
	unstoppable: false,
};
