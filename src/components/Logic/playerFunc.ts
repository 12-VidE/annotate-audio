// Import - Type
import type { AudioChunk } from "src/types";
import { Ref } from "vue";

/**
 * Start player audio reproduction
 * @param chunk option
 * @param currentTime SharedRef
 */
export function playPlayer(
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk>,
	currentTime: Readonly<number>
): void {
	// IF inside chunk
	if (currentTime <= chunk.endTime) player.play();
}

/**
 * Stop player audio reproduction
 * @param chunk - option
 * @param currentTime - SharedRef
 */
export function pausePlayer(
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk>,
	currentTime: Ref<number>
): void {
	currentTime.value = player.currentTime;

	player.pause();
}

/**
 * Toggle between player "play" and "pause"
 * @param chunk - option
 * @param currentTime - SharedRef
 */
export function togglePlayer(
	player: HTMLAudioElement,
	chunk: Readonly<AudioChunk>,
	currentTime: Ref<number>
): void {
	player.paused
		? playPlayer(player, chunk, currentTime.value)
		: pausePlayer(player, chunk, currentTime);
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
