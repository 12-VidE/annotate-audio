import {
	App,
	MarkdownPostProcessorContext,
	Modal,
	Notice,
	Setting,
} from "obsidian";
// Import - Type
import type { AudioChunk, Layout } from "./types";
// Import - Constant
import { layoutsArray } from "./const";
// Import - Function
import {
	getAudioboxOptions,
	setAudioboxOptions,
} from "./components/Logic/codeblockFunc";
import { secondsToTime, timeToSeconds } from "./utils";
import { reactive } from "vue";
import { playPlayer } from "./components/Logic/playerFunc";

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
	// Comments
	autoplay: boolean; // WHEN clicking on a comment, the playes does NOT pause
	unstoppable: boolean; // Player doesn't stop WHEN adding a comment
};

export const defaultAudioBoxOptions: AudioBoxOptions = {
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
	// Comments
	autoplay: false,
	unstoppable: false,
};

export function createOptions(): AudioBoxOptions {
	return reactive<AudioBoxOptions>({
		source: "",
		// Player
		chunk: reactive({ startTime: 0, endTime: 0 }),
		volume: 0.5,
		speed: 1,
		loop: false,
		// UI
		layout: 0,
		sticky: false,
		title: undefined,
		// Comments
		autoplay: false,
		unstoppable: false,
	});
}
/* -------------- */
/* --- Modal --- */
/* ------------- */

export class PropertiesModal extends Modal {
	private source: string;
	private ctx: MarkdownPostProcessorContext;
	private container: HTMLElement;
	private options: AudioBoxOptions; // Record of all the options
	private totalDuration: number;

	constructor(
		source: string,
		ctx: MarkdownPostProcessorContext,
		container: HTMLElement,
		obsidianApp: App,
		totalDuration: number
	) {
		super(obsidianApp);

		this.source = source;
		this.ctx = ctx;
		this.container = container;
		this.totalDuration = totalDuration;

		this.init(); // Call an async method instead
	}

	private async init() {
		this.options = getAudioboxOptions(this.source, this.totalDuration);
		if (!this.options.chunk) {
			this.options.chunk = { startTime: 0, endTime: 0 };
		}

		const { contentEl } = this;

		/* ----------------------- */
		/* --- Options - Audio --- */
		/* ----------------------- */
		new Setting(contentEl).setName("Audio preferences").setHeading();
		// Volume
		new Setting(contentEl).setName("Volume").then((setting) => {
			// Create the value label first
			const valueLabel = setting.settingEl.createEl("span", {
				text: this.options.volume.toFixed(1),
				cls: "slider-display",
			});

			// Add the slider
			setting.addSlider((slider) => {
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.options.volume)
					.setInstant(true)
					.onChange((value: number) => {
						this.options.volume = value;
						valueLabel.textContent = value.toFixed(1);
					});
			});

			// Add display
			setting.controlEl.appendChild(valueLabel);
		});

		// Speed
		new Setting(contentEl).setName("Playback speed").then((setting) => {
			// Create the value label first
			const valueLabel = setting.settingEl.createEl("span", {
				text: this.options.speed.toFixed(1),
				cls: "slider-display",
			});

			// Add the slider
			setting.addSlider((slider) => {
				slider
					.setLimits(0.3, 4, 0.1)
					.setValue(this.options.speed)
					.setInstant(true)
					.onChange((value: number) => {
						this.options.speed = value;
						valueLabel.textContent = value.toFixed(1);
					});
			});

			// Add display
			setting.controlEl.appendChild(valueLabel);
		});

		// Loop
		new Setting(contentEl)
			.setName("Loop")
			.setDesc("When the track ends, it plays back from the beginning")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.loop)
					.onChange((value: boolean) => {
						this.options.loop = value;
					})
			);

		// Autoplay
		new Setting(contentEl)
			.setName("Autoplay")
			.setDesc("When clicking on a comment, the player is forced to play")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.autoplay)
					.onChange((value: boolean) => {
						this.options.autoplay = value;
					})
			);

		// Chuck (Junky but it works)
		let chunkStartTime: {
			inputEl: HTMLInputElement;
			setValue: (val: string) => void;
		} | null = null;
		let chunkEndTime: {
			inputEl: HTMLInputElement;
			setValue: (val: string) => void;
		} | null = null;

		new Setting(contentEl)
			.setName("Chunk")
			.setDesc("What part of the audio track to reproduce")
			.addExtraButton((btn) =>
				btn.setIcon("trash-2").onClick(() => {
					chunkStartTime?.setValue("00:00:00");
					chunkEndTime?.setValue(secondsToTime(this.totalDuration));
					this.options.chunk = {
						startTime: 0,
						endTime: this.totalDuration,
					};
				})
			)
			.addText((text) => {
				// Chunk start
				chunkStartTime = text;
				text.inputEl.type = "time";
				text.inputEl.step = "1";
				text.inputEl.min = "00:00:00";
				text.inputEl.max = secondsToTime(this.totalDuration);

				let savedStart = this.options.chunk?.startTime
					? secondsToTime(this.options.chunk.startTime)
					: "00:00:00";
				text.setValue(savedStart);

				text.inputEl.addEventListener("change", (event: Event) => {
					const newStart = (event.target as HTMLInputElement).value;
					if (chunkEndTime && newStart > chunkEndTime.inputEl.value) {
						// Revert change
						text.setValue(savedStart);
					} else {
						// Allow change
						savedStart = newStart;
						this.options.chunk!.startTime = timeToSeconds(newStart);
						// Update the minimum for the end time
						if (chunkEndTime) {
							chunkEndTime.inputEl.min = newStart;
						}
					}
				});
			})
			.addText((text) => {
				// Chunk end
				chunkEndTime = text;
				text.inputEl.type = "time";
				text.inputEl.step = "1";
				text.inputEl.min = chunkStartTime
					? chunkStartTime.inputEl.value
					: "00:00:00";
				text.inputEl.max = secondsToTime(this.totalDuration);

				let savedEnd = this.options.chunk?.endTime
					? secondsToTime(this.options.chunk.endTime)
					: secondsToTime(this.totalDuration);
				text.setValue(savedEnd);

				text.inputEl.addEventListener("change", (event: Event) => {
					const newEnd = (event.target as HTMLInputElement).value;
					if (
						(chunkStartTime &&
							newEnd < chunkStartTime.inputEl.value) ||
						newEnd > text.inputEl.max // TODO Perché devo forzarlo per farlo funzionare?
					) {
						// Revert change
						text.setValue(savedEnd);
					} else {
						// Allow change
						savedEnd = newEnd;
						this.options.chunk!.endTime = timeToSeconds(newEnd);
					}
				});
			});

		/* ------------------------ */
		/* --- Options - Player --- */
		/* ------------------------ */
		new Setting(contentEl).setName("Player preferences").setHeading();

		// Layout
		new Setting(contentEl).setName("Layout").addDropdown((dropdown) => {
			// Convert layouts array to record so it can be rendered
			const layoutsRecord: Record<string, string> = Object.fromEntries(
				layoutsArray.map((layout: Layout, index: number) => [
					index,
					layout.name,
				])
			);
			dropdown
				.addOptions(layoutsRecord)
				.setValue(String(this.options.layout))
				.onChange((value: string) => {
					this.options.layout = Number(value);
				});
		});

		// Sticky
		new Setting(contentEl)
			.setName("Sticky commands")
			.setDesc("The mains controls follow you as you scroll")
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.sticky)
					.onChange((value: boolean) => {
						this.options.sticky = value;
					})
			);

		// Unstoppable
		new Setting(contentEl)
			.setName("Unstoppable")
			.setDesc(
				"The audio will continue playing even when adding/modifing a comment"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.unstoppable)
					.onChange((value: boolean) => {
						this.options.unstoppable = value;
					})
			);

		// Title
		new Setting(contentEl)
			.setName("Title")
			.setDesc(
				"Want to show a title? Leave empty to use the audio filename"
			)
			.then((setting) => {
				// TODO Junky ma sembra funzionare
				const container = setting.settingEl.createDiv();
				container.style.display = "flex";
				container.style.alignItems = "center";

				// text input container (left side)
				const textContainer = container.createDiv();
				textContainer.style.flex = "1";
				textContainer.style.display =
					this.options.title !== undefined ? "flex" : "none"; // Set initial state
				new Setting(textContainer).addText((text) => {
					if (this.options.title !== undefined)
						text.setValue(this.options.title);
					text.setPlaceholder("File name").onChange(
						(value: string) => {
							this.options.title = value;
						}
					);
				});

				const toggleContainer = container.createDiv();
				new Setting(toggleContainer).addToggle((toggle) =>
					toggle
						.setValue(this.options.title !== undefined)
						.onChange((value: boolean) => {
							if (value == false) this.options.title = undefined;
							else this.options.title = "";
							// Toggle the visibility of the text input container
							textContainer.style.display = value
								? "flex"
								: "none";
						})
				);
			});

		// Confirm/Cancel buttons
		new Setting(contentEl)
			.setHeading() // So they dont have the above divider
			.addButton((btn) =>
				btn.setIcon("check").onClick(() => {
					setAudioboxOptions(
						this.ctx,
						this.container,
						this.app,
						this.options
					);
					this.close();
					new Notice("Options have been updated.");
				})
			)
			.addButton((btn) =>
				btn.setIcon("x").onClick(() => {
					this.close();
				})
			);
	}

	onClose() {
		// Clean content
		this.contentEl.empty();
	}

	/**
	 * Open the modal
	 */
	public openPropertiesModal() {
		this.open();
	}
}

/* -------------- */
/* --- Format --- */
/* -------------- */

/**
 *
 * @param options AudioBox options to process
 * @returns Lines containing the options formatted as they will in codeblock
 */
export function formatOptions(options: AudioBoxOptions): string[] {
	// Convert newOptions object into an array
	// Special formatting are treated separetly
	const newOptionsArray = Object.entries(options)
		.map(([key, value]) => {
			switch (key) {
				case "source":
					return `source: [[${value}]]`;
				case "title":
					if (value == undefined) return ``;
					else if (value == "") return `title: `;
					else return `title: ${value}`;
				case "chunk":
					const chunk = value as AudioChunk;
					if (chunk.endTime > chunk.startTime)
						return `chunk: ${secondsToTime(
							chunk?.startTime
						)}-${secondsToTime(chunk?.endTime)}`;
					else return ``;
				default:
					return `${key}: ${value}`;
			}
		})
		.filter((option) => {
			if (option === ``) return false; // Delete empty strings
			return true;
		});
	newOptionsArray.push(""); // Add spacer
	return newOptionsArray;
}
