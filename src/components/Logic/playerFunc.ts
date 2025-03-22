import { MarkdownPostProcessorContext } from "obsidian";
// Import - Refs
import { chunk, currentTime } from "../sharedRefs";
// Import - Func
import {
	getVolumeSetting,
	getPlaybackSpeedSetting,
	getLoopSetting,
} from "./codeblockFunc";

/**
 *
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @param player
 */
export function playPlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement
): void {
	// IF inside chunk
	if (!chunk.value || currentTime.value <= chunk.value.endTime) {
		// Apply player settings
		player.volume = getVolumeSetting(ctx, container);
		player.playbackRate = getPlaybackSpeedSetting(ctx, container);
		player.loop = getLoopSetting(ctx, container);
		// Play
		player.play();
	}
}

/**
 *
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @param player
 */
export function pausePlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement
): void {
	currentTime.value = player.currentTime;

	player.pause();
}

/**
 * Toggle between "play" and "pause"
 * @param ctx - The MarkdownPostProcessorContext from the parent
 * @param container - The container element from the parent
 * @param player
 */
export function togglePlayer(
	ctx: MarkdownPostProcessorContext,
	container: HTMLElement,
	player: HTMLAudioElement
): void {
	player.paused
		? playPlayer(ctx, container, player)
		: pausePlayer(ctx, container, player);
}

/**
 * Set player-head position
 * @param player
 * @param time - WHERE to reproduce the audio (inside chunk)
 */
export function setPlayerPosition(player: HTMLAudioElement, time: number) {
	// IF moving within chunk
	if (time <= chunk.value?.startTime!) {
		// IF moving BEFORE chunk, move @ start
		player.currentTime = chunk.value?.startTime!;
		currentTime.value = chunk.value?.startTime!;
	} else if (time >= chunk.value?.endTime!) {
		// IF moving AFTER chunk, move @end
		player.currentTime = chunk.value?.endTime!;
		currentTime.value = chunk.value?.endTime!;
	} else {
		// IF moving WITHIN chunk
		player.currentTime = time;
		currentTime.value = time;
	}
}
