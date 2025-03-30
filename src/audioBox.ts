import { MarkdownRenderChild } from "obsidian";
import { App, createApp } from "vue";
// Import - Component
import ParentApp from "./components/ParentApp.vue";
import NotFoundApp from "./components/404.vue";
// Import - Type
import type { AudioBoxParameters } from "./types";

export class AudioBox extends MarkdownRenderChild {
	vueApp: App<Element>;
	container: HTMLElement;
	constructor(options: AudioBoxParameters) {
		super(options.container);
		this.container = options.container;
		// Select who to render based on necessity
		const selectedComponent = options.audioSource ? ParentApp : NotFoundApp;

		this.vueApp = createApp(selectedComponent, {
			container: options.container,
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
