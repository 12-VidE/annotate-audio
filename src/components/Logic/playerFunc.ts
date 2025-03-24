import { MarkdownPostProcessorContext } from "obsidian";
// Import - Func
import {
	getVolumeSetting,
	getPlaybackSpeedSetting,
	getLoopSetting,
} from "./codeblockFunc";
// Import - Type
import type { AudioChunk } from "src/types";
import { Ref } from "vue";

/**
 * Start player audio reproduction
 * @param chunk - SharedRef
 * @param currentTime - SharedRef
 */
export function playPlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk | undefined>,
	currentTime: Readonly<number>
): void {
	// IF inside chunk
	if (!chunk || currentTime <= chunk.endTime) {
		// Apply player settings
		player.volume = getVolumeSetting(ctx, container);
		player.playbackRate = getPlaybackSpeedSetting(ctx, container);
		player.loop = getLoopSetting(ctx, container);
		// Play
		player.play();
	}
}

/**
 * Stop player audio reproduction
 * @param chunk - SharedRef
 * @param currentTime - SharedRef
 */
export function pausePlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk | undefined>,
	currentTime: Ref<number>
): void {
	currentTime.value = player.currentTime;

	player.pause();
}

/**
 * Toggle between player "play" and "pause"
 * @param player - SharedRef
 * @param chunk - SharedRef
 */
export function togglePlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk | undefined>,
	currentTime: Ref<number>
): void {
	player.paused
		? playPlayer(ctx, container, player, chunk, currentTime.value)
		: pausePlayer(ctx, container, player, chunk, currentTime);
}

/**
 * Set player-head position
 * @param chunk - SharedRef
 * @param currentTime  - SharedRef
 * @param time - WHERE to reproduce the audio (possible inside chunk)
 */
export function setPlayerPosition(
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk | undefined>,
	currentTime: Ref<number>,
	time: number
) {
	if (time <= chunk?.startTime!) {
		// IF moving BEFORE chunk, move @ start
		player.currentTime = chunk?.startTime!;
		currentTime.value = chunk?.startTime!;
	} else if (time >= chunk?.endTime!) {
		// IF moving AFTER chunk, move @end
		player.currentTime = chunk?.endTime!;
		currentTime.value = chunk?.endTime!;
	} else {
		// IF moving WITHIN chunk
		player.currentTime = time;
		currentTime.value = time;
	}
}
