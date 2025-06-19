// 中文

export default {
	// main.ts
	ADD_AUDIOBOX_NAME: "添加音频播放器",
	ADD_COMMENT_NAME: "插入评论",
	PAUSE_AUDIOBOX_NAME: "暂停",
	PLAY_AUDIOBOX_NAME: "播放",
	TOGGLE_AUDIOBOX_NAME: "切换",
	MOVE_FORWARD_NAME: "向前",
	MOVE_BACKWARD_NAME: "向后",

	/* --- OPTIONS --- */

	// options/optionsType.ts
	LAYOUT_OPTION: "布局",
	VOLUME_OPTION: "音量",
	SPEED_OPTION: "播放速度",
	LOOP_OPTION: "循环",
	LOOP_OPTION_DESC: "当播放结束时，从头开始播放",
	AUTOPLAY_OPTION: "自动播放",
	AUTOPLAY_OPTION_DESC: "点击评论时，播放器将直接跳转并播放",
	CHUNK_OPTION: "片段区间",
	CHUNK_OPTION_DESC: "选择要播放的音频片段区间",
	STICKY_OPTION: "粘性布局",
	STICKY_OPTION_DESC: "主控件在滚动时跟随滚动（Sticky）",
	UNSTOPPABLE_OPTION: "持续播放",
	UNSTOPPABLE_OPTION_DESC: "在添加或修改评论时，音频将持续播放",
	DECIMALS_OPTION: "小数位",
	DECIMALS_OPTION_DESC: "显示时间采用几位小数",
	TITLE_OPTION: "标题",
	TITLE_OPTION_DESC: "是否显示标题（留空则使用音频文件名）",

	// options/optionsModal.ts
	AUDIO_PREFERERENCES_TITLE: "音频偏好设置",
	PLAYER_PREFERENCES_TITLE: "播放器偏好设置",
	OPTIONS_UPDATE_NOTICE: "选项已更新",

	/* --- LAYOUT --- */

	// layout/layoutType.ts
	DEFAUTL_LAYOUT_NAME: "默认",
	BIG_LAYOUT_NAME: "更大",
	GEEK_LAYOUT_NAME: "极客",

	// layout/Layout404.vue
	ERROR_TAG: "无效/不存在的音频源文件",
	CLICK_TAG: "点击选择",

	// layout/LayoutGeek.vue
	get CHUNK_START_TOOLTIP() {
		return `${this.CHUNK_OPTION}: 选择开始时间`;
	},
	get CHUNK_END_TOOLTIP() {
		return `${this.CHUNK_OPTION}: 选择结束时间`;
	},
	get CHUNK_DELETE_TOOLTIP() {
		return `${this.CHUNK_OPTION}: 删除`;
	},
};
