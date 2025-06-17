// Italian - Italiano

export default {
	// main.ts
	ADD_AUDIOBOX_NAME: "Aggiungi audiobox",
	ADD_COMMENT_NAME: "Inserisci commento",
	PAUSE_AUDIOBOX_NAME: "Metti in pausa",
	PLAY_AUDIOBOX_NAME: "Riproduci audiobox",
	TOGGLE_AUDIOBOX_NAME: "Riproduci/Pausa audiobox",
	MOVE_FORWARD_NAME: "Vai avanti",
	MOVE_BACKWARD_NAME: "Vai indietro",

	/* --- OPTIONS --- */

	// options/optionsType.ts
	VOLUME_OPTION: "Volume",
	SPEED_OPTION: "Velocità riproduzione",
	LOOP_OPTION: "Ripeti",
	LOOP_OPTION_DESC:
		"Quando la traccia termina, la riproduzione ricomincia da capo",
	AUTOPLAY_OPTION: "Riproduzione automatica",
	AUTOPLAY_OPTION_DESC:
		"Cliccando su un commento, la riproduzione partirà automaticamente",
	CHUNK_OPTION: "Porzione",
	CHUNK_OPTION_DESC:
		"Seleziona quale parte della traccia si vuole riprodurre",
	STICKY_OPTION: "Appiccicoso",
	STICKY_OPTION_DESC:
		"I controlli principali rimangono visibili quando si scorre la pagina",
	UNSTOPPABLE_OPTION: "Inarrestabilie",
	UNSTOPPABLE_OPTION_DESC:
		"La traccia non verrà fermata durale all'aggiunta/modifica di un commento",
	DECIMALS_OPTION: "Decimali",
	DECIMALS_OPTION_DESC:
		"Quanti decimali sono visibili quando viene mostrato il tempo",
	TITLE_OPTION: "Titolo",
	TITLE_OPTION_DESC:
		"Vuoi mostare un titolo? Lascia vuoto per usare il nome del file audio",

	// options/optionsModal.ts
	AUDIO_PREFERERENCES_TITLE: "Preferenze audio",
	PLAYER_PREFERENCES_TITLE: "Preferenze player",
	OPTIONS_UPDATE_NOTICE: "Le opzioni sono state aggiornate",

	/* --- LAYOUT --- */

	// layout/layoutType.ts
	DEFAUTL_LAYOUT_NAME: "Base",
	BIG_LAYOUT_NAME: "Grande",
	GEEK_LAYOUT_NAME: "Tecnico",

	// layout/Layout404.vue
	ERROR_TAG: "Sorgente audio invalida/assente",
	CLICK_TAG: "Premi per selezionare",

	// layout/LayoutGeek.vue
	get CHUNK_START_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Seleziona l'inizio`;
	},
	get CHUNK_END_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Seleziona la fine`;
	},
	get CHUNK_DELETE_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Elimina`;
	},
};
