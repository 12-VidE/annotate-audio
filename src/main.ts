import {
	getLinkpath,
	Plugin,
	MarkdownPostProcessorContext,
	Editor,
	SuggestModal,
	TFile,
	App,
	Notice,
} from "obsidian";
import { createApp } from "vue";
// Import - Function
import { getSourceOption } from "./components/Logic/codeblockFunc";
// Import - Component
import SourceSuggestion from "./components/SourceSuggestion.vue";
import { AudioBox } from "./audioBox";
// Import - Constant
import { defaultAudioBoxOptions, formatOptions } from "./options";
import { allowedAudioExtension } from "./const";
import { retriveDuration } from "./components/sharedFunc";

/* -------------- */
/* --- Plugin --- */
/* -------------- */

export default class AnnotateAudioPlugin extends Plugin {
	private audioboxList: Map<string, HTMLAudioElement> = new Map();
	private lastInteractedAudioboxId: string | null = null;

	async onload() {
		/* -----------------*/
		/* --- Commands --- */
		/* ---------------- */
		// Add audiobox
		this.addCommand({
			id: "add-audio-box",
			name: "Add audiobox",
			editorCallback: async (editor: Editor) => {
				let defaultOptions = defaultAudioBoxOptions;
				// Show modal to select source audio file
				defaultOptions.source = await new sourceModal(
					this.app
				).openWithPromise();

				// Add the CORRECT default chunk
				let file = this.app.metadataCache.getFirstLinkpathDest(
					defaultOptions.source,
					""
				);
				const file2 = this.app.vault.getResourcePath(file!);
				defaultOptions.chunk = {
					startTime: 0,
					endTime: await retriveDuration(file2),
				};
				// Convert options into formatted string
				const optionsString: string = formatOptions(
					defaultAudioBoxOptions
				).join("\n");
				// Create codeblock
				editor.replaceSelection(
					"```annotate-audio\n" + optionsString + "\n```"
				);
			},
		});
		// Add comment
		this.addCommand({
			id: "add-comment",
			name: "Insert comment",
			checkCallback: (checking: boolean) => {
				if (!this.lastInteractedAudioboxId) return false;
				if (!checking) {
					const ev = new CustomEvent("add-comment", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
				}
				return true;
			},
		});
		// Pause audiobox
		this.addCommand({
			id: "pause-audiobox",
			name: "Pause audiobox",
			checkCallback: (checking: boolean) => {
				if (
					!this.lastInteractedAudioboxId ||
					this.audioboxList.get(this.lastInteractedAudioboxId)?.paused
				)
					return false;
				if (!checking) {
					const ev = new CustomEvent("pause-audiobox", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
					new Notice("Audiobox has been paused");
				}
				return true;
			},
		});
		// Play audiobox
		this.addCommand({
			id: "play-audiobox",
			name: "Play audiobox",
			checkCallback: (checking: boolean) => {
				if (
					!this.lastInteractedAudioboxId ||
					!this.audioboxList.get(this.lastInteractedAudioboxId)
						?.paused
				)
					return false;
				if (!checking) {
					const ev = new CustomEvent("play-audiobox", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
					new Notice("Audiobox is playing");
				}
				return true;
			},
		});
		// Toggle audiobox
		this.addCommand({
			id: "toggle-audiobox",
			name: "Toggle audiobox",
			checkCallback: (checking: boolean) => {
				if (!this.lastInteractedAudioboxId) return false;
				if (!checking) {
					const ev = new CustomEvent("toggle-audiobox", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
					new Notice("Audiobox has been toggled");
				}
				return true;
			},
		});
		// Forward
		this.addCommand({
			id: "audiobox-forward",
			name: "Move forward",
			checkCallback: (checking: boolean) => {
				if (!this.lastInteractedAudioboxId) return false;
				if (!checking) {
					const ev = new CustomEvent("audiobox-forward", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
					new Notice("Audiobox is moving forward");
				}
				return true;
			},
		});
		// Backward
		this.addCommand({
			id: "audiobox-backward",
			name: "Move backward",
			checkCallback: (checking: boolean) => {
				if (!this.lastInteractedAudioboxId) return false;
				if (!checking) {
					const ev = new CustomEvent("audiobox-backward", {
						detail: { id: this.lastInteractedAudioboxId },
					});
					document.dispatchEvent(ev);
					new Notice("Audiobox is moving backward");
				}
				return true;
			},
		});

		/* this.registerObsidianProtocolHandler("audioplayer", (e) => {
                const parameters = e as {
                    action: string;
                    playerId?: string;
                    chapter?: string;
                };
                if (e.das) {
                    e.das;
                }
            }); */

		/* -------------- */
		/* --- Render --- */
		/* -------------- */
		this.registerMarkdownCodeBlockProcessor(
			"annotate-audio",
			(
				source: string,
				el: HTMLElement,
				ctx: MarkdownPostProcessorContext
			) => {
				// Get the source
				let audioSource: string = "";
				const sourceValue: string | undefined = getSourceOption(
					ctx,
					el
				);
				if (sourceValue) {
					const link = this.app.metadataCache.getFirstLinkpathDest(
						getLinkpath(sourceValue),
						sourceValue
					);
					// Check IF valid
					if (link && allowedAudioExtension.includes(link.extension))
						audioSource = link.path;
				}

				// Generate a unique ID per block
				const audioboxId =
					audioSource ||
					`annotate-audio-${ctx.sourcePath}-${ctx.docId}`;

				// Check if an existing player already exists for this audio source
				let player: HTMLAudioElement;

				if (this.audioboxList.has(audioboxId))
					player = this.audioboxList.get(audioboxId)!;
				else {
					player = document.createElement("audio");
					this.audioboxList.set(audioboxId, player);
				}

				// Set up the container
				let container = el.createDiv({
					cls: "annotate-audio-container",
					attr: { "data-audio-id": audioboxId, tabindex: 0 },
				});
				container.appendChild(player);

				// Set the currently active audio on click
				container.addEventListener("click", () => {
					this.lastInteractedAudioboxId = audioboxId;
				});

				// Render
				ctx.addChild(
					new AudioBox({
						container,
						audioSource,
						ctx,
						player,
						obsidianApp: this.app,
					})
				);
			}
		);
	}

	onunload() {
		Object.values(this.audioboxList).forEach((player) => {
			player.pause();
			player.remove();
			player.source = "";
		});
		this.audioboxList.clear();
		this.lastInteractedAudioboxId = null;
	}
}

/* -------------- */
/* --- Modal --- */
/* ------------- */

export class sourceModal extends SuggestModal<TFile> {
	private sourcePromise!: (value: string) => void;
	private vueSuggestions: Map<HTMLElement, any> = new Map();

	constructor(obsidianApp: App) {
		super(obsidianApp);
		this.setPlaceholder("Select an audio file");
	}

	/**
	 * @param query - What (audio file) to search for
	 * @returns Files to choose from
	 */
	getSuggestions(query: string): TFile[] {
		return this.app.vault.getFiles().filter((file) => {
			// Remove non-audio file (by looking @ their extension)
			if (!allowedAudioExtension.includes(file.extension)) return false;
			// Return files that match the query
			return file.basename.toLowerCase().includes(query.toLowerCase());
		});
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		const app = createApp(SourceSuggestion, {
			obsidianApp: this.app,
			file: file,
		});
		// Render option
		app.mount(el);
		// Save option
		this.vueSuggestions.set(el, app);
	}

	onClose() {
		// Unmount vue apps
		this.vueSuggestions.forEach((app) => app.unmount());
		this.vueSuggestions.clear();
	}

	onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
		// Generate link of choosen file
		const linkText = this.app.metadataCache.fileToLinktext(file, file.path);
		// "Return" the result
		this.sourcePromise(linkText);

		this.close();
	}

	/**
	 * Open this modal + make everything else wait for its response
	 * @returns Wikilink to the source
	 */
	public openWithPromise(): Promise<string> {
		this.open();
		return new Promise((wikilink) => {
			this.sourcePromise = wikilink;
		});
	}
}
