<template>
	<div class="layout--404">
		<div @click="eventAddSource">
			<div class="main_content">
				<span ref="disk_icon"></span>{{ t("ERROR_TAG") }}
			</div>
			<div class="minor">{{ t("CLICK_TAG") }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { App, MarkdownPostProcessorContext } from "obsidian";
import { onMounted, ref } from "vue";
// Import - Type
import type { AudioBoxOptions } from "src/options/optionsType";
import type { SharedRefs } from "src/types";
// Import - Class
import { sourceModal } from "src/options/source/sourceModal";
// Import - Functions
import { initIcon } from "src/utils";
import { setAudioboxOptions } from "src/options/optionsSetter";
import { getAudioboxOptions } from "src/options/optionsGetter";
import { retriveDuration } from "src/utils";
import { t } from "src/lang/helpers";

const props = defineProps<{
	source: string;
	container: HTMLElement;
	ctx: MarkdownPostProcessorContext;
	obsidianApp: App;
	sharedRefs: SharedRefs;
}>();

/* ----------------- */
/* --- Lifecycle --- */
/* ----------------- */

// UI
const disk_icon = ref<HTMLElement | null>(null);

onMounted(() => {
	// Initialize icons
	initIcon(disk_icon.value, "disc-3");
});

/* ---------------- */
/* --- Function --- */
/* ---------------- */

/* ------------------------- */
/* --- Function ON Event --- */

async function eventAddSource(): Promise<void> {
	// Get the saved options and update the source
	let options: AudioBoxOptions = getAudioboxOptions(
		props.source,
		await retriveDuration(props.ctx.sourcePath)
	);
	options.source = await new sourceModal(props.obsidianApp).openWithPromise();
	setAudioboxOptions(props.ctx, props.container, props.obsidianApp, options);
}
</script>
