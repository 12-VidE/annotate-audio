// English

export default {
	// main.ts
	ADD_AUDIOBOX_NAME: "Add audiobox",
	ADD_COMMENT_NAME: "Insert comment",
	PAUSE_AUDIOBOX_NAME: "Pause audiobox",
	PLAY_AUDIOBOX_NAME: "Play audiobox",
	TOGGLE_AUDIOBOX_NAME: "Toggle audiobox",
	MOVE_FORWARD_NAME: "Move forward",
	MOVE_BACKWARD_NAME: "Move backward",

	/* --- OPTIONS --- */

	// options/optionsType.ts
	LAYOUT_OPTION: "Layout",
	VOLUME_OPTION: "Volume",
	SPEED_OPTION: "Playback speed",
	LOOP_OPTION: "Loop",
	LOOP_OPTION_DESC: "When the track ends, it plays back from the beginning",
	AUTOPLAY_OPTION: "Autoplay",
	AUTOPLAY_OPTION_DESC:
		"When clicking on a comment, the player is forced to play",
	CHUNK_OPTION: "Chunk",
	CHUNK_OPTION_DESC: "What part of the audio track to reproduce",
	STICKY_OPTION: "Sticky",
	STICKY_OPTION_DESC: "The mains controls follow you as you scroll",
	UNSTOPPABLE_OPTION: "Unstoppable",
	UNSTOPPABLE_OPTION_DESC:
		"The audio will continue playing even when adding/modifing a comment",
	DECIMALS_OPTION: "Decimals",
	DECIMALS_OPTION_DESC: "How many decimals to show when displaying time",
	TITLE_OPTION: "Title",
	TITLE_OPTION_DESC:
		"Want to show a title? Leave empty to use the audio filename",

	// options/optionsModal.ts
	AUDIO_PREFERERENCES_TITLE: "Audio preferences",
	PLAYER_PREFERENCES_TITLE: "Player preferences",
	OPTIONS_UPDATE_NOTICE: "Options have been updated",

	/* --- LAYOUT --- */

	// layout/layoutType.ts
	DEFAUTL_LAYOUT_NAME: "Default",
	BIG_LAYOUT_NAME: "Big",
	GEEK_LAYOUT_NAME: "Geek",

	// layout/Layout404.vue
	ERROR_TAG: "Invalid/Absent audio source",
	CLICK_TAG: "Click to select",

	// layout/LayoutGeek.vue
	get CHUNK_START_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Select start`;
	},
	get CHUNK_END_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Select end`;
	},
	get CHUNK_DELETE_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Delete`;
	},
};
