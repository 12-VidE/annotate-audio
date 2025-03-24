import {
	getLinkpath,
	Plugin,
	MarkdownPostProcessorContext,
	Editor,
} from "obsidian";
import { AudioBox } from "./audioBox";
import { defaultAudioBoxOptions } from "./types";

export default class AnnotateAudioPlugin extends Plugin {
	playersList: Record<string, HTMLAudioElement> = {};
	activePlayerId: string | null = null;

	async onload() {
		/* -----------------*/
		/* --- Commands --- */
		/* ---------------- */
		this.addCommand({
			id: "add-audio-box",
			name: "Add audiobox",
			editorCallback: (editor: Editor) => {
				const optionsString = Object.entries(defaultAudioBoxOptions)
					.map(
						([key, value]) =>
							`${key}: ${value === undefined ? "" : value}`
					)
					.join("\n");

				editor.replaceSelection(
					"```annotate-audio\nsource: \n" + optionsString + "\n\n```"
				);
			},
		});
		this.addCommand({
			id: "add-comment",
			name: "Insert comment",
			checkCallback: (checking: boolean) => {
				if (this.activePlayerId) {
					if (!checking) {
						const ev = new CustomEvent("insertComment", {
							detail: { id: this.activePlayerId },
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

				// Find source
				const sourceRegex = /source:\s*\[\[([^|\]]+)/;
				const sourceValue: string | undefined = sourceRegex
					.exec(source)
					?.at(1);
				if (!sourceValue) {
					console.error("Specify a valid source");
					return;
				}
				const link = this.app.metadataCache.getFirstLinkpathDest(
					getLinkpath(sourceValue),
					sourceValue
				);
				const allowedExtensions = [
					"mp3",
					"wav",
					"ogg",
					"flac",
					"mp4",
					"m4a",
					"webm",
				];
				if (!link || !allowedExtensions.includes(link.extension)) {
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
					this.activePlayerId = uniqueId;
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
	}
}
