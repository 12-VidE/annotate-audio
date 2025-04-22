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
import { App, TFile } from "obsidian";
import { computed, onBeforeMount, onMounted, ref } from "vue";
// Import - Functions
import { secondsToTime, retriveDuration, initIcon } from "src/utils";

const props = defineProps<{
	obsidianApp: App;
	file: TFile;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */
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
	initIcon(durationIcon.value, "timer");
	initIcon(dateIcon.value, "calendar-days");
});

/* ---------------- */
/* --- Computed --- */
/* ---------------- */

const getCreationDate = computed(() => {
	return new Date(props.file.stat.mtime).toLocaleDateString();
});
</script>
