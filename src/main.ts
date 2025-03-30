import {
	getLinkpath,
	Plugin,
	MarkdownPostProcessorContext,
	Editor,
	SuggestModal,
	TFile,
	App,
} from "obsidian";
import { createApp } from "vue";
// Import - Function
import { getSourceSetting } from "./components/Logic/codeblockFunc";
// Import - Component
import SourceSuggestion from "./components/SourceSuggestion.vue";
import { AudioBox } from "./audioBox";
// Import - Constant
import { defaultAudioBoxOptions } from "./options";
import { allowedAudioExtension } from "./const";

/* -------------- */
/* --- Plugin --- */
/* -------------- */

export default class AnnotateAudioPlugin extends Plugin {
	private playersList: Record<string, HTMLAudioElement> = {};
	private lastInteractedPlayerId: string | null = null;

	async onload() {
		/* -----------------*/
		/* --- Commands --- */
		/* ---------------- */
		this.addCommand({
			id: "add-audio-box",
			name: "Add audiobox",
			editorCallback: async (editor: Editor) => {
				// Show modal (and await for it's result) so user can choose the source audio file
				const sourceValue = await new sourceModal(
					this.app
				).openWithPromise();
				// Transform default options into string
				const optionsString = Object.entries(defaultAudioBoxOptions)
					.map(
						([key, value]) =>
							`${key}: ${value === undefined ? "" : value}`
					)
					.join("\n");
				// Create codeblock
				editor.replaceSelection(
					"```annotate-audio\nsource: " +
						sourceValue +
						"\n" +
						optionsString +
						"\n\n```"
				);
			},
		});
		this.addCommand({
			id: "add-comment",
			name: "Insert comment",
			checkCallback: (checking: boolean) => {
				if (this.lastInteractedPlayerId) {
					if (!checking) {
						const ev = new CustomEvent("insertComment", {
							detail: { id: this.lastInteractedPlayerId },
						});
						document.dispatchEvent(ev);
					}
					return true;
				}
			},
		});

		/* this.addCommand({
                id: "pause-audio",
                name: "Pause Audio",
                checkCallback: (checking: boolean) => {
                    if (this.activeAudioId && this.audioPlayers[this.activeAudioId]) {
                        if (!checking) {
                            new Notice("Audio paused");
                            const ev = new Event("allpause");
                            document.dispatchEvent(ev);
                            this.audioPlayers[this.activeAudioId].pause();
                        }
                        return true;
                    }
                },
            }); */
		/* this.addCommand({
                id: "resume-audio",
                name: "Resume Audio",
                checkCallback: (checking: boolean) => {
                    const isAudioOpen = true; //#TODO
                    if (isAudioOpen) {
                        if (!checking) {
                            new Notice("Audio resumed");
                            const ev = new Event("allresume");
                            document.dispatchEvent(ev);
                            if (this.player.src)
                                this.player.play();
                        }
                        return true;
                    }
                },
            });*/

		/*
            this.addCommand({
                id: "audio-forward-5s",
                name: "+5 sec",
                checkCallback: (checking: boolean) => {
                    const isAudioOpen = true; //#TODO
                    if (isAudioOpen) {
                        if (!checking) {
                            if (this.player.src)
                                this.player.currentTime += 5;
                        }
                        return true;
                    }
                },
            });
            this.addCommand({
                id: "audio-back-5s",
                name: "-5 sec",
                checkCallback: (checking: boolean) => {
                    const isAudioOpen = true; //#TODO
                    if (isAudioOpen) {
                        if (!checking) {
                            if (this.player.src)
                                this.player.currentTime -= 5;
                        }
                        return true;
                    }
                },
            });*/

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
				// Generate a unique ID per block
				const uniqueId = `annotate-audio-${ctx.sourcePath}-${ctx.docId}`;

				// Get the source
				const sourceValue = ((v) => (Array.isArray(v) ? v[0] : v))(
					getSourceSetting(ctx, el)
				);

				if (!sourceValue) {
					console.error("Specify a valid source");
					return;
				}
				const link = this.app.metadataCache.getFirstLinkpathDest(
					getLinkpath(sourceValue),
					sourceValue
				);
				// Check IF valid (useful WHEN: source is removed OR user manually input it)
				if (!link || !allowedAudioExtension.includes(link.extension)) {
					console.error("Invalid source or extension");
					return;
				}

				let container = el.createDiv({
					cls: "annotate-audio-container",
					attr: { "data-audio-id": uniqueId, tabindex: 0 }, // Add unique ID
				});

				// Store player instances
				if (!this.playersList[uniqueId]) {
					this.playersList[uniqueId] =
						document.createElement("audio");
					container.appendChild(this.playersList[uniqueId]);
				}

				// Set the currently active audio on click
				container.addEventListener("click", () => {
					document
						.querySelectorAll(".annotate-audio-container")
						.forEach((el) => el.classList.remove("active"));
					container.classList.add("active");
					this.lastInteractedPlayerId = uniqueId;
				});
				// Register the Vue component as a child so that it persists
				ctx.addChild(
					new AudioBox({
						container,
						audioSource: link.path,
						ctx,
						player: this.playersList[uniqueId],
						obsidianApp: this.app,
					})
				);
			}
		);
	}

	onunload() {
		Object.values(this.playersList).forEach((player) => player.remove());
		this.lastInteractedPlayerId = null;
	}
}

/* -------------- */
/* --- Modal --- */
/* ------------- */

class sourceModal extends SuggestModal<TFile> {
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
		// "Return" the result (as wikilink)
		this.sourcePromise(`[[${linkText}]]`);

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
