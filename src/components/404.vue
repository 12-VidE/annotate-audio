<template>
	<div class="layout--404">
		<div @click="eventAddSource">
			<div class="main_content">
				<span ref="disk_icon"></span>Invalid/Absent audio source
			</div>
			<div class="minor">Click to select</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { App, MarkdownPostProcessorContext, setIcon } from "obsidian";
import { onMounted, ref } from "vue";
import { getAudioboxOptions, setAudioboxOptions } from "./Logic/codeblockFunc";
import { AudioBoxOptions } from "src/options";
import { sourceModal } from "src/main";
const disk_icon = ref<HTMLElement | null>(null);

const props = defineProps<{
	source: string;
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	obsidianApp: App;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

onMounted(() => {
	// Initialize icons
	if (disk_icon.value) setIcon(disk_icon.value, "disc-3");
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

/* ------------------------- */
/* --- Function ON Event --- */

async function eventAddSource(): Promise<void> {
	// Get the saved options and update the source
	let options: AudioBoxOptions = getAudioboxOptions(
		props.ctx,
		props.container,
		0,
		props.source
	);
	options.source = await new sourceModal(props.obsidianApp).openWithPromise();
	setAudioboxOptions(props.ctx, props.container, props.obsidianApp, options);
}
</script>
