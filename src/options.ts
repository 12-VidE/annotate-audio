import { App, MarkdownPostProcessorContext, Modal, Setting } from "obsidian";
// Import - Type
import type { AudioChunk } from "./types";
import {
	getAudioboxOptions,
	setAudioboxOptions,
} from "./components/Logic/codeblockFunc";

// What can be changed inside audio-box
export type AudioBoxOptions = {
	volume: number; // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume
	speed: number; // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate
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

/* -------------- */
/* --- Modal --- */
/* ------------- */

export function openPropertiesModal(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	obsidianApp: App
) {
	new PropertiesModal(ctx, container, obsidianApp).open();
}

class PropertiesModal extends Modal {
	private options: AudioBoxOptions;
	private ctx: MarkdownPostProcessorContext;
	private container: HTMLElement;

	constructor(
		ctx: MarkdownPostProcessorContext,
		container: HTMLElement,
		obsidianApp: App
	) {
		super(obsidianApp);

		this.ctx = ctx;
		this.container = container;

		this.setTitle("Setting audio-box");

		this.init(); // Call an async method instead
	}

	private async init() {
		this.options = await getAudioboxOptions(this.ctx, this.container);

		const { contentEl } = this;
		contentEl.empty();

		// Volume
		new Setting(contentEl)
			.setName("Volume")
			.setDesc("Player volume")
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.options.volume)
					.onChange((value: number) => {
						this.options.volume = value;
					})
			);
		// Speed
		new Setting(contentEl)
			.setName("Playback Speed")
			.setDesc("Player volume")
			.addSlider((slider) =>
				slider
					.setLimits(0.25, 4, 0.1)
					.setValue(this.options.speed)
					.onChange((value: number) => {
						this.options.speed = value;
					})
			);
		// Loop
		new Setting(contentEl)
			.setName("Loop")
			.setDesc("Enable loop")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.loop)
					.onChange((value: boolean) => {
						this.options.loop = value;
					})
			);
		// Sticky
		new Setting(contentEl)
			.setName("isSticky")
			.setDesc("Enable sticky player")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.sticky)
					.onChange((value: boolean) => {
						this.options.sticky = value;
					})
			);
		// Autoplay
		new Setting(contentEl)
			.setName("Autoplay")
			.setDesc("Enable Autoplay")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.autoplay)
					.onChange((value: boolean) => {
						this.options.autoplay = value;
					})
			);

		// Title
		new Setting(contentEl)
			.setName("Title")
			.setDesc("Set Title")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.autoplay)
					.onChange((value: boolean) => {
						// Toggle the visibility of the text setting
						textSetting.settingEl.style.display = value
							? "block"
							: "none";
					})
			);
		const textSetting = new Setting(contentEl)
			.setName("Input text")
			.addText((text) => {
				text.setPlaceholder("Enter your text here");
			});
		textSetting.settingEl.style.display = "none";

		// Layout
		new Setting(contentEl)
			.setName("Layout")
			.setDesc("Select Layout")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("1", "Default")
					.addOption("2", "Minimal")
					.setValue(String(this.options.layout))
					.onChange((value: string) => {
						this.options.layout = Number(value);
					})
			);

		// CHUNK ?!

		// Submit button
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					// Copy values back into original refs only if they are writable
					setAudioboxOptions(
						this.ctx,
						this.container,
						this.app,
						this.options
					);
					this.close();
				})
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
