import { MarkdownRenderChild } from "obsidian";
import { App, createApp } from "vue";
import VueApp from "./components/App.vue";

import type { AudioBoxParameters } from "./types";

export class AudioBox extends MarkdownRenderChild {
	vueApp: App<Element>;
	container: HTMLElement;

	constructor(options: AudioBoxParameters) {
		super(options.container);
		this.container = options.container;
		const sectionInfo = options.ctx.getSectionInfo(options.container);
		this.vueApp = createApp(VueApp, {
			codeblockContent: options.codeblockContent,
			codeblockPosition: {
				start: sectionInfo?.lineStart,
				end: sectionInfo?.lineEnd,
			},
			audioSource: options.audioSource,
			ctx: options.ctx,
			player: options.player,
			obsidianApp: options.obsidianApp,
		});
	}

	onload(): void {
		this.vueApp.mount(this.container);
	}

	onunload(): void {
		this.vueApp.unmount();
	}
}
