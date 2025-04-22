import { MarkdownRenderChild } from "obsidian";
import { App, createApp } from "vue";
// Import - Component
import ParentApp from "./components/ParentApp.vue";
import Layout404 from "./layout/Layout404.vue";
// Import - Type
import type { AudioBoxParameters } from "./types";

export class AudioBox extends MarkdownRenderChild {
	vueApp: App<Element>;
	container: HTMLElement;
	audioboxId: string;
	onUnload: (id: string) => void;

	constructor(options: AudioBoxParameters, onUnload: (id: string) => void) {
		super(options.container);
		// Copy to class
		this.container = options.container;
		this.onUnload = onUnload;
		this.audioboxId = options.id;

		// Select who to render based on necessity
		const selectedComponent = options.audioSource ? ParentApp : Layout404;

		this.vueApp = createApp(selectedComponent, {
			id: options.id,
			source: options.source,
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
		// Remove audiobox from the list
		this.onUnload(this.audioboxId);

		this.vueApp.unmount();
	}
}
