import { MarkdownPostProcessorContext, App } from "obsidian";

export type AudioComment = {
	time: number;
	content: string;
};

export type AudioChunk = {
	startTime: number;
	endTime: number;
	duration?: number;
};

// What can be changed inside audio-box
export type AudioBoxOptions = {
	volume: number;
	speed: number;
	loop: boolean;
	sticky: boolean;
	title: string | undefined;
	layout: number;
	chunk: AudioChunk | undefined;
	autoplay: boolean;
};

export const defaultAudioBoxOptions: AudioBoxOptions = {
	volume: 0.5,
	speed: 1,
	loop: false,
	sticky: false,
	title: undefined,
	layout: 1,
	chunk: undefined,
	autoplay: false,
};

export type AudioBoxParameters = {
	container: HTMLElement;
	audioSource: string;
	ctx: MarkdownPostProcessorContext;
	player: HTMLAudioElement;
	obsidianApp: App;
};
