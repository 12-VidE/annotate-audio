// Español

export default {
	// main.ts
	ADD_AUDIOBOX_NAME: "Añadir caja de sonido",
	ADD_COMMENT_NAME: "Insertar comentario",
	PAUSE_AUDIOBOX_NAME: "Pausar caja de sonido",
	PLAY_AUDIOBOX_NAME: "Reproducir caja de sonido",
	TOGGLE_AUDIOBOX_NAME: "Encender/apagar caja de sonido",
	MOVE_FORWARD_NAME: "Adelantar",
	MOVE_BACKWARD_NAME: "Rebobinar",

	/* --- OPTIONS --- */

	// options/optionsType.ts
	LAYOUT_OPTION: "Diseño",
	VOLUME_OPTION: "Volumen",
	SPEED_OPTION: "Velocidad",
	LOOP_OPTION: "Bucle",
	LOOP_OPTION_DESC: "Cuando la pista termine, volverá a empezar",
	AUTOPLAY_OPTION: "Reproducción automática",
	AUTOPLAY_OPTION_DESC:
		"Al presionar un comentario, la pista comenzará a reproducirse",
	CHUNK_OPTION: "Duración",
	CHUNK_OPTION_DESC: "Qué parte de la pista de audio se reproducirá",
	STICKY_OPTION: "Sincronización",
	STICKY_OPTION_DESC: "Los controles te seguirán a medida que deslizes",
	UNSTOPPABLE_OPTION: "Imparable",
	UNSTOPPABLE_OPTION_DESC:
		"El audio se seguirá reproduciendo incluso al agregar/editar un comentario",
	DECIMALS_OPTION: "Decimales",
	DECIMALS_OPTION_DESC: "Cuántos decimales aparecerán al mostrar el reloj",
	TITLE_OPTION: "Título",
	TITLE_OPTION_DESC:
		"¿Quieres agregar un título? Déjalo en blanco para utilizar el nombre del archivo",

	// options/optionsModal.ts
	AUDIO_PREFERERENCES_TITLE: "Preferencias de audio",
	PLAYER_PREFERENCES_TITLE: "Preferencias del reproductor",
	OPTIONS_UPDATE_NOTICE: "Los ajustes se han actualizado",

	/* --- LAYOUT --- */

	// layout/layoutType.ts
	DEFAUTL_LAYOUT_NAME: "Por defecto",
	BIG_LAYOUT_NAME: "Grande",
	GEEK_LAYOUT_NAME: "Geek",

	// layout/Layout404.vue
	ERROR_TAG: "Fuente de audio inválida o ausente",
	CLICK_TAG: "Presiona para seleccionar",

	// layout/LayoutGeek.vue
	get CHUNK_START_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Definir inicio`;
	},
	get CHUNK_END_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Definir final`;
	},
	get CHUNK_DELETE_TOOLTIP() {
		return `${this.CHUNK_OPTION}: Eliminar`;
	},
};
