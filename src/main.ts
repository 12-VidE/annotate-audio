import {
	getLinkpath,
	Plugin,
	MarkdownPostProcessorContext,
	Editor,
	Notice,
} from "obsidian";

// Import - Component
import { AudioBox } from "./audioBox";
// Import - Constant
import {
	AudioBoxOptions,
	DEFAULT_AUDIOBOX_OPTIONS,
} from "./options/optionsType";
import { allowedAudioExtension } from "./const";
import { hashObj, retriveDuration } from "./utils";
// Import - Function
import {
	getAudioboxId,
	getAudioboxOptions,
	getSourceOption,
} from "./options/optionsGetter";
import { formatOptions } from "./options/optionsLogic";
import { sourceModal } from "./options/source/sourceModal";
import { DEFAULT_SHARED_REFS, SharedRefs } from "./types";
import { AudioComment } from "./comment/commentType";
import { getComments } from "./comment/commentLogic";
import { formatCodeblock, writeCodeblock } from "./codeblockLogic";

/* -------------- */
/* --- Plugin --- */
/* -------------- */

export default class AnnotateAudioPlugin extends Plugin {
	private audioboxMap: Map<string, AudioBox> = new Map();
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
				let defaultOptions = DEFAULT_AUDIOBOX_OPTIONS;
				// Create ID
				const bytes = new Uint8Array(8); // 8 bytes = 16 hex characters
				crypto.getRandomValues(bytes);
				const audioboxId = Array.from(bytes, (b) =>
					b.toString(16).padStart(2, "0")
				).join("");

				// Show modal to select source audio file
				defaultOptions.source = await new sourceModal(
					this.app
				).openWithPromise();

				// Add the CORRECT default chunk
				const file = this.app.metadataCache.getFirstLinkpathDest(
					defaultOptions.source,
					""
				);
				const filePath = this.app.vault.getResourcePath(file!);
				defaultOptions.chunk = {
					startTime: 0,
					endTime: await retriveDuration(filePath),
				};
				// Convert options into formatted string
				const optionsString: string = formatOptions(
					DEFAULT_AUDIOBOX_OPTIONS
				).join("\n");
				const codeblock =
					"```annotate-audio\n#" +
					audioboxId +
					"\n" +
					optionsString +
					"\n```\n";
				// Print codeblock + move outside
				const cursor = editor.getCursor(); // Get the current cursor position
				editor.replaceSelection(codeblock); // Place codeblock
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
				const sourceValue: string | undefined = getSourceOption(source);
				if (sourceValue) {
					const link = this.app.metadataCache.getFirstLinkpathDest(
						getLinkpath(sourceValue),
						sourceValue
					);
					// Check IF valid
					if (link && allowedAudioExtension.includes(link.extension))
						audioSource = link.path;
				}

				// Get block ID

				const audioboxId = getAudioboxId(source);
				if (!audioboxId) {
					console.error("No ID");
					return;
				}

				// Check if an existing player already exists for this audio source
				let audiobox: AudioBox;

				if (this.audioboxList.has(audioboxId)) {
					// IF the audiobox already exists
					audiobox = this.audioboxMap.get(audioboxId)!;
				} else {
					// IF the audiobox is new
					// ####
					// #### ▼▼ This is the only place WHERE we read the codeblock
					// ####
					const player: HTMLAudioElement =
						document.createElement("audio");
					const sharedRefs: SharedRefs = { ...DEFAULT_SHARED_REFS };
					const options: AudioBoxOptions = getAudioboxOptions(source);
					const comments: AudioComment[] = getComments(source);

					// Set up the container
					let container = el.createDiv({
						cls: "annotate-audio-container",
						attr: { "data-audio-id": audioboxId, tabindex: 0 },
					});
					container.appendChild(player!);

					// Set the currently active audio on click
					container.addEventListener("click", () => {
						this.lastInteractedAudioboxId = audioboxId;
					});

					audiobox = new AudioBox(
						{
							id: audioboxId,
							source,
							container,
							audioSource,
							ctx,
							player: player!,
							obsidianApp: this.app,

							sharedRefs,
							options,
							comments,
						},
						// Function to perfome WHEN 1 audiobox is unloaded
						(
							id: string,
							player: HTMLAudioElement,
							options: AudioBoxOptions,
							comments: AudioComment[]
						) => {
							// Clean it an remove it
							const unloadedAudiobox = this.audioboxMap.get(id);
							if (unloadedAudiobox) {
								console.log("UnMounted");
								this.audioboxMap.delete(id);

								player.pause();
								player.remove();

								// ####
								// #### ▼▼ This is the only place WHERE we write to the codeblock
								// ####
								const formattedCodeblock = formatCodeblock(
									id,
									options,
									comments
								);
								writeCodeblock(
									ctx,
									container,
									this.app,
									formattedCodeblock
								);
								// Save cache
								localStorage.setItem(
									`aa_${id}_optionsHash`,
									hashObj(options)
								);
								localStorage.setItem(
									`aa_${id}_options`,
									JSON.stringify(options)
								);
								localStorage.setItem(
									`aa_${id}_currentTime`,
									JSON.stringify(player.currentTime)
								);
							}
							// Check IF it's the last interacted one and remove it
							if (this.lastInteractedAudioboxId === id)
								this.lastInteractedAudioboxId = null;
						}
					);

					this.audioboxMap.set(audioboxId, audiobox);
				}

				// Render
				ctx.addChild(audiobox);
			}
		);
	}

	onunload() {
		Object.values(this.audioboxMap).forEach((audiobox) => {
			audiobox.player.pause();
			audiobox.player.remove();
			audiobox.player.source = "";
		});
		this.audioboxMap.clear();
		this.lastInteractedAudioboxId = null;
	}
}
