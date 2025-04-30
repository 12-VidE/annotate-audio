import { MarkdownRenderChild } from "obsidian";
import { App, createApp, ref } from "vue";
// Import - Component
import ParentApp from "./ParentApp.vue";
import Layout404 from "./layout/Layout404.vue";
// Import - Type
import {
	DEFAULT_SHARED_REFS,
	type AudioBoxParameters,
	type SharedRefs,
} from "./types";
import {
	AudioBoxOptions,
	DEFAULT_AUDIOBOX_OPTIONS,
} from "./options/optionsType";
import { AudioComment } from "./comment/commentType";

export class AudioBox extends MarkdownRenderChild {
	vueApp: App<Element>;
	container: HTMLElement;
	audioboxId: string;
	player: HTMLAudioElement;
	private sharedRefs = ref<SharedRefs>(DEFAULT_SHARED_REFS);
	private options = ref<AudioBoxOptions>(DEFAULT_AUDIOBOX_OPTIONS);
	private comments = ref<AudioComment[]>([]);
	onUnload: (
		id: string,
		player: HTMLAudioElement,
		options: AudioBoxOptions,
		comments: AudioComment[]
	) => void;

	constructor(
		options: AudioBoxParameters,
		onUnload: (
			id: string,
			player: HTMLAudioElement,
			options: AudioBoxOptions,
			comments: AudioComment[]
		) => void
	) {
		super(options.container);
		// Copy to class
		this.container = options.container;
		this.onUnload = onUnload;
		this.audioboxId = options.id;
		this.player = options.player;
		this.sharedRefs.value = options.sharedRefs;
		this.options.value = options.options;
		this.comments.value = options.comments;

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

			sharedRefs: this.sharedRefs.value,
			"onUpdate:sharedRefs": (newVal: SharedRefs) => {
				this.sharedRefs.value = newVal;
			},
			options: this.options.value,
			"onUpdate:options": (newVal: AudioBoxOptions) => {
				this.options.value = newVal;
			},
			comments: this.comments.value,
			"onUpdate:comments": (newVal: AudioComment[]) => {
				this.comments.value = newVal;
			},
		});
	}

	onload(): void {
		this.vueApp.mount(this.container);
	}

	onunload(): void {
		// Remove audiobox from the list
		this.onUnload(
			this.audioboxId,
			this.player,
			this.options.value,
			this.comments.value
		);

		this.vueApp.unmount();
	}
}
