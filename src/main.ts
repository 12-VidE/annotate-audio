import {
	getLinkpath,
	Plugin,
	MarkdownPostProcessorContext,
	Editor,
} from "obsidian";
import { AudioBox } from "./audioBox";
import { defaultAudioBoxOptions } from "./types";

export default class AnnotateAudioPlugin extends Plugin {
	/* audioPlayers: { [id: string]: HTMLAudioElement } = {};
	activeAudioId: string | null = null; */
	/* player!: HTMLAudioElement */
	async onload() {
		/* this.player = document.createElement("audio");
		const body = document.getElementsByTagName("body")[0];
		body.appendChild(this.player); */

		/* -----------------*/
		/* --- Commands --- */
		/* ---------------- */
		this.addCommand({
			id: "add-audio-box",
			name: "Add Audio-Box",
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
		/* this.addCommand({
			id: "add-comment",
			name: "Add Comment",
			checkCallback: (checking: boolean) => {
				const isAudioOpen = true; //#TODO
				if (isAudioOpen) {
					if (!checking) {
						const ev = new Event("addcomment");
						document.dispatchEvent(ev);
					}
					return true;
				}
			},
		}); */
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

				// Create container
				const container = el.createDiv();
				const localPlayer = document.createElement("audio");
				container.appendChild(localPlayer);

				// Render vue app
				ctx.addChild(
					new AudioBox({
						container: el,
						codeblockContent: source,
						audioSource: link.path,
						ctx: ctx,
						player: localPlayer,
						obsidianApp: this.app,
					})
				);
			}
		);
	}

	onunload() {
		//#Fix
		/* Object.values(this.audioPlayers).forEach((player) => {
			if (player.parentElement) {
				player.parentElement.removeChild(player);
			}
			player.remove();
		});
		this.audioPlayers = {}; */
	}
}
