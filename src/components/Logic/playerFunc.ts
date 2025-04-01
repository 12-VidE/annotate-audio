// Import - Type
import type { AudioChunk } from "src/types";
import { Ref } from "vue";

/**
 * Start player audio reproduction (pausing all the others)
 * @param audioSource ID
 * @param chunk option
 * @param currentTime SharedRef
 */
export function playPlayer(
	player: HTMLAudioElement,
	audioSource: string,
	chunk: Readonly<AudioChunk>,
	currentTime: Readonly<number>
): void {
	// IF inside chunk
	if (currentTime <= chunk.endTime) {
		// Pause all other players
		const ev = new CustomEvent("pauseAllPlayers", {
			detail: { emitingPlayerId: audioSource },
		});
		document.dispatchEvent(ev);
		// Force this player to start
		player.play();
	}
}

/**
 * Stop player audio reproduction
 * @param chunk - option
 * @param currentTime - SharedRef
 */
export function pausePlayer(
	player: HTMLAudioElement,
	audioSource: string,
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
	audioSource: string,
	chunk: Readonly<AudioChunk>,
	currentTime: Ref<number>
): void {
	player.paused
		? playPlayer(player, audioSource, chunk, currentTime.value)
		: pausePlayer(player, audioSource, chunk, currentTime);
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
