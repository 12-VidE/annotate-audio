<template>
	<div class="source-suggestion-container">
		<div>
			<span class="filename"> {{ file.basename }} </span>
			<span class="extension"> .{{ file.extension }} </span>
		</div>
		<div class="metadata-container">
			<span> <i ref="dateIcon"></i>{{ getCreationDate }} </span>
			|
			<span> <i ref="durationIcon"></i> {{ duration }} </span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { App, setIcon, TFile } from "obsidian";
import { secondsToTime } from "src/utils";
import { computed, onBeforeMount, onMounted, ref } from "vue";

const props = defineProps<{
	obsidianApp: App;
	file: TFile;
}>();

/* ------------ */
/* --- Refs --- */
/* ------------ */
const duration = ref<string | null>(null);
// UI
const durationIcon = ref<HTMLElement | null>(null);
const dateIcon = ref<HTMLElement | null>(null);

onBeforeMount(async () => {
	getAudioDuration();
});

onMounted(() => {
	// Initialize icons
	if (durationIcon.value) setIcon(durationIcon.value, "timer");
	if (dateIcon.value) setIcon(dateIcon.value, "calendar-days");
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const getCreationDate = computed(() => {
	return new Date(props.file.stat.mtime).toLocaleDateString();
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */
async function getAudioDuration() {
	try {
		const tempAudioPlayer = new Audio();
		tempAudioPlayer.src = props.obsidianApp.vault.getResourcePath(
			props.file
		);
		tempAudioPlayer.preload = "metadata"; // Impose metadata loading

		duration.value = await new Promise((resolve, reject) => {
			tempAudioPlayer.onloadedmetadata = () => {
				// WHEN metadata is loaded, return the duration
				resolve(secondsToTime(tempAudioPlayer.duration));
			};
			tempAudioPlayer.onerror = () => {
				reject(new Error("Failed to load list of audio files"));
			};
		});
	} catch (error) {
		console.error(error);
	}
}
</script>
