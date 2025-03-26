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

export type AudioBoxParameters = {
	container: HTMLElement;
	audioSource: string;
	ctx: MarkdownPostProcessorContext;
	player: HTMLAudioElement;
	obsidianApp: App;
};
