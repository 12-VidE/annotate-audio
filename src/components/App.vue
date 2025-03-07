<template>
	<div class="audio-box" tabindex="0">
		<div v-show="displayTitle" class="audio-box-title">
			<span ref="titleIcon"></span>{{ displayTitle }}
		</div>
		<!-- WaveGraph -->
		<div v-if="!isSmall" :class="['vert', 'wide', showInput && 'disabled']">
			<div :class="['waveform', 'wide']">
				<div
					v-for="(s, i) in waveGraphHeights"
					:class="{ bar: true, playedBar: i <= currentBar }"
					:key="srcPath + i"
					:style="{ height: s * 100 + 'px' }"
				></div>
			</div>
		</div>
		<div
			ref="stickyContainer"
			:class="['sticky-container', isSticky && 'is-sticky']"
		>
			<!-- Timeline -->
			<div
				:class="[
					'timeline-container',
					'vert',
					'wide',
					showInput && 'disabled',
				]"
			>
				<input
					type="range"
					min="0"
					:max="duration"
					step="0.1"
					v-model="currentTime"
					@input="onTimeBarInput"
				/>
				<div :class="['timeline']">
					<span>{{ displayCurrentTime }}</span>
					<span>{{ displayDuration }}</span>
				</div>
			</div>
			<!-- Controls -->
			<div :class="['controls-container', showInput && 'disabled']">
				<div
					ref="min5"
					:class="['control_btn', 'secondary_btn']"
					@click="movePlayerPosition(-5)"
				>
					-5s
				</div>
				<div
					ref="playpause_btn"
					:class="['control_btn']"
					@click="togglePlayer"
				></div>
				<div
					ref="add5"
					:class="['control_btn', 'secondary_btn']"
					@click="movePlayerPosition(+5)"
				>
					+5s
				</div>
				<div
					ref="showCommentInput"
					:class="['control_btn', 'commentInput_btn']"
					@click="showCommentInputBox"
				></div>
			</div>
			<!-- Comment Input -->
			<div v-if="showInput" :class="['comment-input-box']">
				<input
					type="text"
					ref="commentInput"
					v-model="commentInputBox"
					:class="[isDuplicate && 'disabled']"
					@keydown.escape="imposeDefaultState"
					@keydown.enter="addComment"
				/>
				<div :class="['comment-buttons']">
					<button
						:class="[isDuplicate && 'disabled']"
						@click="addComment"
					>
						{{ editMode ? "Confirm" : "Add" }}
					</button>
					<button @click="imposeDefaultState">Cancel</button>
					<button
						v-if="editMode"
						@click="confirmDeleteComment"
						:style="{
							'background-color': deleteConfirmation
								? 'var(--interactive-accent)'
								: '',
						}"
					>
						{{ deleteConfirmation ? "Sure?" : "Delete" }}
					</button>
				</div>
			</div>
		</div>
		<!-- Comment List -->
		<div :class="['comment-list', showInput && 'disabled']">
			<AudioCommentVue
				v-for="comment in getCommentsArray()"
				:class="{
					'active-comment': comment.time === activeComment?.time,
				}"
				@play-from="setPlayerPosition"
				@edit-comment="editComment"
				:comment="comment"
				:obsidianApp="obsidianApp!"
				:key="comment.time"
			>
			</AudioCommentVue>
		</div>
	</div>
</template>

<script lang="ts">
import {
	TFile,
	setIcon,
	MarkdownPostProcessorContext,
	App,
	normalizePath,
} from "obsidian";
import { defineComponent, PropType /* onMounted, onUnmounted */ } from "vue";
import AudioCommentVue from "./AudioComment.vue";
import { secondsToTime } from "../utils";
import { defaultAudioBoxOptions } from "../types";

import type { AudioComment /* AudioChunk */ } from "../types";
import type { Pos } from "obsidian";

export default defineComponent({
	name: "App",
	components: {
		AudioCommentVue,
	},
	props: {
		codeblockContent: String, // What's inside the code-block
		codeblockPosition: Object as PropType<Pos>, // Where to find the code-block in the file
		audioSource: String, // What's inside "source"
		ctx: Object as PropType<MarkdownPostProcessorContext>,
		player: Object as PropType<HTMLAudioElement>,
		obsidianApp: Object as PropType<App>,
	},
	data() {
		return {
			//WaveGraph
			nSamples: 150 as number, // N° of bars in WaveGraph
			waveGraphHeights: [] as number[],

			//Player
			srcPath: "",
			duration: 0 as number, // Durant of the audio track
			currentTime: 0 as number, // WHERE is the player @?

			// Comments
			commentInputBox: "" as string, // Content of input-box WHEN creating/modififing comment
			editedCommentTime: null as number | null, // Time (=index) of comment we are trying to modify
			activeComment: null as AudioComment | null, // Comment that player is reproducing

			// States
			isSticky: false, // IF we enable the player to be sticky
			isSmall: false, // What player size we want
			isDuplicate: false, // WHEN we want to create a timestamp WHERE it already exists
			deleteConfirmation: false, // IF the user confirm he wants to delete the comment
			editMode: false,
			showInput: false,
		};
	},
	computed: {
		displayCurrentTime() {
			return secondsToTime(this.currentTime);
		},
		displayDuration() {
			return secondsToTime(this.duration);
		},
		displayTitle() {
			const title = this.getTitleSetting();
			if (title === undefined) {
				// Show nothing IF there's no 'title' option
				return false;
			} else if (title === "") {
				const sourceValue: string = this.getSourceSetting();
				if (typeof sourceValue === "string") {
					// Use source (cleaning extension)
					return sourceValue.replace(/\.[^/.]+$/, "");
				} else {
					// Use alias in the source (IF present)
					return sourceValue[1];
				}
			} else {
				// Return 'title' option IF specied
				return title;
			}
		},
		currentBar() {
			return Math.floor(
				(this.currentTime / this.duration) * this.nSamples
			);
		},
	},
	methods: {
		/* ---------------- */
		/* --- Back-End --- */
		/* ---------------- */
		async loadFile(): Promise<void> {
			// Read file from vault
			const file = this.obsidianApp.vault.getAbstractFileByPath(
				this.audioSource
			) as TFile;
			// Process audio file & set audio source
			if (file && file instanceof TFile) {
				//check cached values
				if (!this.loadCache()) await this.processAudio(file.path);
				this.srcPath = this.obsidianApp.vault.getResourcePath(file);
			}
			this.player.src = this.srcPath;

			/* console.log(this.getChunkSetting()); */
		},
		saveCache(): void {
			localStorage[`${this.audioSource}`] = JSON.stringify(
				this.waveGraphHeights
			);
			localStorage[`${this.audioSource}_duration`] =
				this.duration.toString();
		},
		loadCache(): boolean {
			let cachedData = localStorage[`${this.audioSource}`];
			let cachedDuration = localStorage[`${this.audioSource}_duration`];

			if (!cachedData || !cachedDuration) return false;

			this.waveGraphHeights = JSON.parse(cachedData);
			this.duration = Math.trunc(Number.parseFloat(cachedDuration));
			return true;
		},
		async processAudio(path: string): Promise<void> {
			const arrBuf = await this.obsidianApp.vault.adapter.readBinary(
				path
			);
			const audioContext = new AudioContext();
			const tempArray: Array<number> = [];

			audioContext.decodeAudioData(arrBuf, (buf) => {
				let rawData = buf.getChannelData(0);
				this.duration = buf.duration;

				const blockSize = Math.floor(rawData.length / this.nSamples);
				for (let i = 0; i < this.nSamples; i++) {
					let blockStart = blockSize * i;
					let sum = 0;
					for (let j = 0; j < blockSize; j++)
						sum += Math.abs(rawData[blockStart + j]);
					tempArray.push(sum / blockSize);
				}

				let maxval = Math.max(...tempArray);
				this.waveGraphHeights = tempArray.map((x) => x / maxval);
				this.saveCache();
			});
		},
		timeUpdateHandler() {
			if (this.player.src === this.srcPath) {
				this.currentTime = this.player?.currentTime;

				// Set WaveGraph Style: show already player bars
				const nextTimestamps = this.getCommentsArray().filter(
					(comment: AudioComment) =>
						this.player?.currentTime >= comment.time
				);
				if (nextTimestamps.length == 1)
					this.activeComment = nextTimestamps[0];
				else if (nextTimestamps.length > 1)
					this.activeComment =
						nextTimestamps[nextTimestamps.length - 1];
			}
		},
		imposeDefaultState(): void {
			this.showInput = false;
			this.editMode = false;
			this.editedCommentTime = null;
			this.deleteConfirmation = false;
			this.commentInputBox = "";
			this.isDuplicate = false;
		},

		/* --------------------- */
		/* --- Manage Player --- */
		/* --------------------- */
		playPlayer() {
			// Apply player settings
			this.player.volume = this.getVolumeSetting();
			this.player.playbackRate = this.getPlaybackSpeedSetting();
			this.player.loop = this.getLoopSetting();

			this.player?.play();
			setIcon(this.$refs.playpause_btn, "pause");
		},
		pausePlayer() {
			this.player?.pause();
			setIcon(this.$refs.playpause_btn, "play");
		},
		/**
		 * Toggle btw "pause" or "play" on the player
		 */
		togglePlayer() {
			this.player.paused ? this.playPlayer() : this.pausePlayer();
		},
		setPlayerPosition(time: number) {
			this.player.currentTime = time;
		},
		movePlayerPosition(change: number) {
			this.setPlayerPosition(this.player.currentTime + change);
		},
		onTimeBarInput() {
			// Validate and update the audio's current time
			if (!isNaN(this.currentTime) && this.player)
				this.player.currentTime = this.currentTime;
		},

		/* ----------------------- */
		/* --- Manage Comments --- */
		/* ----------------------- */

		/**
		 * (Re)Writing/Cancelling 1 comment inside the codeblock
		 * @param commentOnFocus Comment to work with. If .content = empty → It deletes the comment
		 * @param isNew True: Find the right place for the new comment | False: Work on an existing comment
		 */
		async editCodeblockComment(
			commentOnFocus: AudioComment,
			isNew: boolean
		) {
			if (commentOnFocus.content == "" && isNew) {
				// Impossible state: are we deleting a comment OR adding a new one?
				console.error(
					"Impossible state reached WHEN dealing with comment"
				);
				return;
			}

			// Get file
			const file = this.obsidianApp.vault.getAbstractFileByPath(
				this.ctx.sourcePath
			);
			if (!file || !(file instanceof TFile)) return;
			// Get file full content
			let lines: Array<string> = (
				await this.obsidianApp.vault.read(file)
			).split("\n");

			try {
				const commentsArray: Array<AudioComment> =
					this.getCommentsArray();
				let commentOnFocusIndex: number; // WHERE we will place the new/modified comment (to preserve order). 0 = 1° comment

				if (isNew) {
					// WHEN we need to add a new comment
					if (!commentsArray)
						commentOnFocusIndex = 0; // IF we are adding the 1° comment
					else {
						commentOnFocusIndex = commentsArray.findIndex(
							(item: AudioComment) =>
								commentOnFocus.time < item.time
						);
						if (commentOnFocusIndex === -1)
							commentOnFocusIndex = commentsArray.length; // IF it doesn't find a place: it's the last
					}
				} else {
					// WHEN we need to modify an existing comment
					commentOnFocusIndex = commentsArray.findIndex(
						(item: AudioComment) =>
							commentOnFocus.time === item.time
					);
					if (commentOnFocusIndex == -1) {
						// IF it doesn't find the comment, there must be an error: the comment should exists!
						console.error("Trying to edit a non-existing comment");
						return;
					}
				}

				const commentOnFocusAbsoluteLine =
					this.codeblockPosition.end -
					commentsArray.length +
					commentOnFocusIndex; // line WHERE the comment is place inside the entire file

				// Check IF it's within bounds
				if (
					commentOnFocusAbsoluteLine <
						this.codeblockPosition.end - commentsArray.length ||
					commentOnFocusAbsoluteLine > this.codeblockPosition.end
				)
					return;

				// Implement change
				lines.splice(
					commentOnFocusAbsoluteLine,
					isNew ? 0 : 1,
					...(commentOnFocus.content == ""
						? [] // IF deleting
						: [
								`${commentOnFocus.time} --- ${commentOnFocus.content}`,
						  ]) // IF adding/modifying
				);
				// Write the updated file
				await this.obsidianApp.vault.modify(file, lines.join("\n"));
			} catch (error) {
				console.error("Cannot manage comment - ", error);
			}
			this.imposeDefaultState();
		},
		async addComment() {
			if (this.commentInputBox.length == 0) return; // Empty box is useless

			const commentOnFocus: AudioComment = {
				time: this.editMode
					? this.editedCommentTime
					: Math.floor(this.currentTime),
				content: this.commentInputBox,
			};

			await this.editCodeblockComment(commentOnFocus, !this.editMode);
		},
		async deleteComment(time: number) {
			const commentOnFocus: AudioComment = {
				time: time,
				content: "",
			};
			await this.editCodeblockComment(commentOnFocus, false);
		},
		showCommentInputBox() {
			// Set state
			this.showInput = true;

			this.pausePlayer();

			setTimeout(() => {
				const isNotUnique: boolean = this.getCommentsArray()?.some(
					(timestamp: AudioComment) =>
						timestamp.time === Math.floor(this.currentTime)
				);
				if (isNotUnique && !this.editMode) {
					// IF we want to create a new comment @time WHERE already 1 exits: don't allow it
					this.commentInputBox = "ALREADY EXISTS!";
					this.isDuplicate = true;
				} else {
					// Focus on commentInputBox
					this.$refs.commentInput.focus();
				}
			}, 0);
		},
		confirmDeleteComment() {
			if (!this.deleteConfirmation) {
				// 1°: Set the flag to show "Sure?" on the next click
				this.deleteConfirmation = true;
			} else {
				// 2°: Trigger the actual deletion if confirmed by the user
				this.deleteComment(this.editedCommentTime);
			}
		},
		/**
		 * Show commentInputBox and fills it with comment.content to edit
		 * @param time Index of the comment
		 */
		editComment(time: number) {
			// Set states
			this.showInput = true;
			this.editMode = true;
			this.editedCommentTime = time;

			this.pausePlayer();

			this.commentInputBox = this.getComment(time).content;

			// Scroll commentInputBox into view
			this.$nextTick(() => {
				const commentInputBoxElement = this.$refs
					.commentInput as HTMLInputElement;
				if (commentInputBoxElement) {
					commentInputBoxElement.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
				}
				// Delay focusing until the scrolling completes
				setTimeout(() => {
					commentInputBoxElement.focus();
				}, 300);
			});
		},

		/* ----------------------------  */
		/* --- Code-Block Extraction --- */
		/* ----------------------------  */

		/**
		 * Find mathcing-groups inside code-block, line-by-line
		 * @param regex Regex w/ 1+ matching group to apply inside code-block
		 * @returns What's inside matching group. Each line may for an array IF there are 2+ matching groups
		 */
		getCodeBlockData(regex: RegExp = /^.*$/): Array<string | string[]> {
			const lines: string[] = this.codeblockContent.split("\n");
			return lines
				.map((line) => {
					const match = regex.exec(line);
					if (match) {
						if (match.length === 2) {
							return match[1]; // Only one capturing group → return it directly
						} else if (match.length > 2) {
							return match.slice(1); // More than one capturing group → return an array
						} else {
							return match[0]; // No capturing groups → return full match
						}
					}
					return null;
				})
				.filter(
					(result): result is string | string[] => result !== null
				);
		},
		/**
		 * @returns Array of all (sorted) comments
		 */
		getCommentsArray(): Array<AudioComment> {
			const commentRegex = new RegExp("^(.+) --- (.+)$");
			// Get comments FROM codeblock
			// Format comment into AudioComment
			// Sort comment (just to make sure, they should already be in order)
			const commentArray = this.getCodeBlockData(commentRegex)
				.map(([time, content]: [number, string]) => ({
					time: Number(time),
					content: String(content),
				}))
				.sort((x: AudioComment, y: AudioComment) => x.time - y.time);
			return commentArray;
		},
		/**
		 * @param time (=index) where to find that specific comment
		 * @returns the comment @ that time
		 */
		getComment(time: number): AudioComment | null {
			const commentsArray = this.getCommentsArray();
			let commentIndex: number = commentsArray.findIndex(
				(item: AudioComment) => time == item.time
			);
			return commentsArray[commentIndex] || null;
		},
		/**
		 * @returns audio source
		 */
		getSourceSetting(): Array<string> | string {
			const surceRegex = new RegExp(
				"^source: *\\[\\[([^|\\]]+)(?:\\|([^\\]]*))?\\]\\]$"
			);
			const sourceValue: string = this.getCodeBlockData(surceRegex)[0];
			if (sourceValue[1] && sourceValue[1].length > 0)
				return sourceValue; // Return both file-name and alias (if present)
			else return sourceValue[0]; // Return only file-name (if alias doesn't exists)
			// Notice it cannot be undefined CAUSE it must exists
		},
		/**
		 * @returns Speed @ which to play the audio
		 */
		getPlaybackSpeedSetting(): number {
			const playbackSpeedRegex = new RegExp("^speed: *([0-9\.]*)$");
			const playbackSpeedValue: number =
				this.getCodeBlockData(playbackSpeedRegex)[0];
			if (!playbackSpeedValue) return defaultAudioBoxOptions.speed;
			return Math.round(playbackSpeedValue * 10) / 10; // Truncate to 1° decimal
		},
		/**
		 * @returns Flag IF audio can loop
		 */
		getLoopSetting(): boolean {
			const loopRegex = new RegExp("^loop: *(True|False)$", "i");
			const loopValue: string = this.getCodeBlockData(loopRegex)[0];
			if (!loopValue) return defaultAudioBoxOptions.loop;
			return loopValue.toLowerCase() === "true";
		},
		/**
		 * @returns Volume @ which play the audio
		 */
		getVolumeSetting(): number {
			const volumeRegex = new RegExp("^volume: *([0-9\.]*)$"); // It does not match negative values
			const volumeValue: number = this.getCodeBlockData(volumeRegex)[0];
			if (!volumeValue || volumeValue > 1)
				return defaultAudioBoxOptions.volume;
			return Math.round(volumeValue * 10) / 10; // Truncate to 1° decimal
		},
		/**
		 * @returns Flag IF audio-controls are sticky
		 */
		getStickySetting(): boolean {
			const stickyRegex = new RegExp("^sticky: *(True|False)$", "i");
			const stickyValue: string = this.getCodeBlockData(stickyRegex)[0];
			if (!stickyValue) return defaultAudioBoxOptions.sticky;
			return stickyValue.toLowerCase() === "true";
		},
		/**
		 * @returns title to display
		 */
		getTitleSetting(): string | undefined {
			const titleRegex = new RegExp("^title: *(.*)$");
			const titleValue: string =
				this.getCodeBlockData(titleRegex)[0]?.trim();
			if (titleValue == undefined) return defaultAudioBoxOptions.title; // Useless BUT good practice
			return titleValue;
		},
		/**
		 * @returns Flag IF use "small" or "default" sized player
		 */
		getSmallSetting(): boolean {
			const smallRegex = new RegExp("^small: *(True|False)$", "i");
			const smallValue: string = this.getCodeBlockData(smallRegex)[0];
			if (!smallValue) return defaultAudioBoxOptions.small;
			return smallValue.toLowerCase() === "true";
		},
		/**
		 * @returns Boundaries of the audio
		 */
		/* getChunkSetting(): AudioChunk | undefined {
			const chunkRegex = new RegExp(
				"^chunk: *(\\d{2}:\\d{2}:\\d{2}) *- *(\\d{2}:\\d{2}:\\d{2})$"
			);
			const chunkData = this.getCodeBlockData(chunkRegex)[0];
			if (chunkData === undefined)
				return defaultAudioBoxOptions.chunk; // Useless BUT good practice
			else
				return {
					startTime: chunkData[0],
					endTime: chunkData[1],
				} as AudioChunk;
		}, */
	},
	created() {
		this.loadFile();
	},
	mounted() {
		/* ---------------------- */
		/* --- Initialization --- */
		/* ---------------------- */

		// Initialize icons
		setIcon(this.$refs.playpause_btn, "play");
		setIcon(this.$refs.showCommentInput, "bookmark-plus");
		setIcon(this.$refs.titleIcon, "audio-lines");

		// Initialize player state
		this.isSticky = this.getStickySetting();
		this.isSmall = this.getSmallSetting();

		// Event Listener - End of track #TODO Sposta al posto giusto con gli altri listener
		this.player.addEventListener("ended", () => {
			if (this.player.src === this.srcPath)
				setIcon(this.$refs.playpause_btn, "play");
		});

		// Event Listener - Get current time
		if (this.player.src === this.srcPath) {
			this.currentTime = this.player.currentTime;
			this.player.addEventListener("timeupdate", this.timeUpdateHandler);
			setIcon(
				this.$refs.playpause_btn,
				this.player.paused ? "play" : "pause"
			);
		}
	},
	setup(props) {
		/* const addCommentHandler = () => {
			console.log("yessss", props.audioSource, " -- ");
		}; */
		/* onMounted(() => {
			// Create Event-Listeners
			document.addEventListener("addcomment", addCommentHandler);
		});

		onUnmounted(() => {
			// Destroy Event-Listeners
			document.removeEventListener("addcomment", addCommentHandler);
		}); */
		// Add event listeners (for Obsidian comands)
		/* document.addEventListener('allpause', () => {
            setIcon(this.$refs.playpause_btn, "play");
        });
        document.addEventListener('allresume', () => {
            setIcon(this.playpause_btnBtn, "pause");
        })document.addEventListener('addcomment', () => {

            this.showCommentInput();
        })
        document.addEventListener('togglePlayState', () => {
            if (this.player.src === this.srcPath) {
                this.togglePlayer()
                setIcon(this.$refs.playpause_btn, this.player.paused ? 'play' : 'pause');
            }
        }); */
	},
});
</script>
