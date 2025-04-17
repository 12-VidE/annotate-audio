import { MarkdownPostProcessorContext, App } from "obsidian";
import { ComponentOptions, ComponentProvideOptions } from "vue";

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

export type Layout = {
	name: string;
	component: ComponentOptions<
		{},
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		string,
		{},
		{},
		string,
		{},
		{},
		{},
		string,
		ComponentProvideOptions
	>;
};
