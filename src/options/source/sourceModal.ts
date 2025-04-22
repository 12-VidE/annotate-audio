import { App, SuggestModal, TFile } from "obsidian";
// Import - Components
import SourceSuggestion from "./SourceSuggestion.vue";
// Import - Constants
import { allowedAudioExtension } from "src/const";
import { createApp } from "vue";

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
