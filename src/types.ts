import { MarkdownPostProcessorContext, App } from "obsidian";

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
