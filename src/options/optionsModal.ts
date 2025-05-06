import { App, Modal, Notice, Setting } from "obsidian";
import { toRaw } from "vue";
// Import - Type
import type { AudioBoxOptions } from "./optionsType";
import { type Layout, layoutsArray } from "src/layout/layoutType";
// Import - Functions
import { secondsToTime, timeToSeconds } from "src/utils";
import { t } from "src/lang/helpers";

export class optionsModal extends Modal {
	private options: AudioBoxOptions;
	private totalDuration: number;

	private resolve!: (newOptions: AudioBoxOptions) => void;
	private reject!: () => void;
	public result: Promise<AudioBoxOptions>;

	constructor(
		options: Readonly<AudioBoxOptions>,
		obsidianApp: Readonly<App>,
		totalDuration: Readonly<number>
	) {
		super(obsidianApp);

		this.options = JSON.parse(JSON.stringify(options));
		this.totalDuration = totalDuration;

		this.result = new Promise((res, rej) => {
			this.resolve = res;
			this.reject = rej;
		});

		this.init(); // Call an async method instead
	}

	private async init() {
		const { contentEl } = this;

		/* ----------------------- */
		/* --- Options - Audio --- */
		/* ----------------------- */
		new Setting(contentEl)
			.setName(t("AUDIO_PREFERERENCES_TITLE"))
			.setHeading();

		// Volume
		new Setting(contentEl).setName(t("VOLUME_OPTION")).then((setting) => {
			// Add slider
			setting.addSlider((slider) => {
				slider
					.setLimits(0.1, 1, 0.1)
					.setValue(this.options.volume)
					.setInstant(true)
					.onChange((value: number) => {
						this.options.volume = value;
						valueLabel.textContent = value.toFixed(1);
					});
			});

			// Add label
			const valueLabel = setting.settingEl.createEl("span", {
				text: this.options.volume.toFixed(1),
			});
			setting.controlEl.appendChild(valueLabel);
		});

		// Speed
		new Setting(contentEl).setName(t("SPEED_OPTION")).then((setting) => {
			// Add slider
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

			// Add label
			const valueLabel = setting.settingEl.createEl("span", {
				text: this.options.speed.toFixed(1),
			});
			setting.controlEl.appendChild(valueLabel);
		});

		// Loop
		new Setting(contentEl)
			.setName(t("LOOP_OPTION"))
			.setDesc(t("LOOP_OPTION_DESC"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.loop)
					.onChange((value: boolean) => {
						this.options.loop = value;
					})
			);

		// Autoplay
		new Setting(contentEl)
			.setName(t("AUTOPLAY_OPTION"))
			.setDesc(t("AUTOPLAY_OPTION_DESC"))
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
			.setName(t("CHUNK_OPTION"))
			.setDesc(t("CHUNK_OPTION_DESC"))
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
		new Setting(contentEl)
			.setName(t("PLAYER_PREFERENCES_TITLE"))
			.setHeading();

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
			.setName(t("STICKY_OPTION"))
			.setDesc(t("STICKY_OPTION_DESC"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.sticky)
					.onChange((value: boolean) => {
						this.options.sticky = value;
					})
			);

		// Unstoppable
		new Setting(contentEl)
			.setName(t("UNSTOPPABLE_OPTION"))
			.setDesc(t("UNSTOPPABLE_OPTION_DESC"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.options.unstoppable)
					.onChange((value: boolean) => {
						this.options.unstoppable = value;
					})
			);

		// Title
		new Setting(contentEl)
			.setName(t("TITLE_OPTION"))
			.setDesc(t("TITLE_OPTION_DESC"))
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
					this.resolve(this.options);
					new Notice(t("OPTIONS_UPDATE_NOTICE"));
					this.close();
				})
			)
			.addButton((btn) =>
				btn.setIcon("x").onClick(() => {
					this.reject();
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
		return this.result;
	}
}
