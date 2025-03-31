<template>
	<div class="source-suggestion-container">
		<div>
			<span class="filename"> {{ file.basename }} </span>
			<span class="extension"> .{{ file.extension }} </span>
		</div>
		<div class="metadata-container">
			<i ref="dateIcon"></i> <span>{{ getCreationDate }} </span>
			|
			<i ref="durationIcon"></i> <span> {{ duration }} </span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { App, setIcon, TFile } from "obsidian";
import { secondsToTime } from "src/utils";
import { computed, onBeforeMount, onMounted, ref } from "vue";
import { retriveDuration } from "./sharedFunc";

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
	const sourcePath = props.obsidianApp.vault.getResourcePath(props.file);
	duration.value = secondsToTime(await retriveDuration(sourcePath));
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
</script>
