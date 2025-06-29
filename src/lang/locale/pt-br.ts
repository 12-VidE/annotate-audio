// Português Brasileiro

export default {
	// main.ts
	ADD_AUDIOBOX_NAME: "Adicionar caixa de som",
	ADD_COMMENT_NAME: "Inserir comentário",
	PAUSE_AUDIOBOX_NAME: "Pausar caixa de som",
	PLAY_AUDIOBOX_NAME: "Tocar caixa de som",
	TOGGLE_AUDIOBOX_NAME: "Ligar/desligar caixa de som",
	MOVE_FORWARD_NAME: "Avançar",
	MOVE_BACKWARD_NAME: "Rebobinar",

	/* --- OPTIONS --- */

	// options/optionsType.ts
	LAYOUT_OPTION: "Disenho",
	VOLUME_OPTION: "Volume",
	SPEED_OPTION: "Velocidade",
	LOOP_OPTION: "Repetiçao",
	LOOP_OPTION_DESC:
		"Cuando a faixa terminar, ela será reproduzida novamente do início",
	AUTOPLAY_OPTION: "Reproduçao automática",
	AUTOPLAY_OPTION_DESC:
		"Ao clicar em um comentário, a faixa começará a tocar",
	CHUNK_OPTION: "Duração",
	CHUNK_OPTION_DESC: "Qual parte da faixa de áudio será reproduzida",
	STICKY_OPTION: "Sincronização",
	STICKY_OPTION_DESC:
		"Os controles principais permanecerão visíveis ao rolar a página",
	UNSTOPPABLE_OPTION: "Ininterrupto",
	UNSTOPPABLE_OPTION_DESC:
		"O áudio continuará tocando mesmo ao adicionar ou editar um comentário",
	DECIMALS_OPTION: "Decimais",
	DECIMALS_OPTION_DESC: "Quantos decimais mostrar ao exibir o tempo",
	TITLE_OPTION: "Título",
	TITLE_OPTION_DESC:
		"Quer mostrar um título? Deixe em branco para usar o nome do arquivo de áudio.",

	// options/optionsModal.ts
	AUDIO_PREFERERENCES_TITLE: "Preferências de áudio",
	PLAYER_PREFERENCES_TITLE: "Preferências do reproductor",
	OPTIONS_UPDATE_NOTICE: "As configurações foram atualizadas",

	/* --- LAYOUT --- */

	// layout/layoutType.ts
	DEFAUTL_LAYOUT_NAME: "Padrao",
	BIG_LAYOUT_NAME: "Ampliado",
	GEEK_LAYOUT_NAME: "Geek",

	// layout/Layout404.vue
	ERROR_TAG: "Fonte de áudio inválida ou ausente",
	CLICK_TAG: "Pressione para selecionar",

	// layout/LayoutGeek.vue
	get CHUNK_START_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Definir início`;
	},
	get CHUNK_END_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Definir fim`;
	},
	get CHUNK_DELETE_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Eliminar`;
	},
};
