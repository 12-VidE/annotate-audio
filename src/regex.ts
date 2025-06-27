/* --------------- */
/* --- Options --- */
/* --------------- */
export const sourceRegex = new RegExp("^source: *\\[\\[([^|\\]]+)\\]\\]$");

export const chunkNativeRegex = new RegExp(
	"^chunk: *(\\d{2,}:\\d{2}:\\d{2}.?\\d{0,3}) *- *(\\d{2,}:\\d{2}:\\d{2}.?\\d{0,3})$"
);
export const chunkLRCRegex = new RegExp(
	"^chunk: *(\\d{2,}:\\d{2}.\\d{2}) *- *(\\d{2,}:\\d{2}.\\d{2})$"
);

export const volumeRegex = new RegExp("^volume: *([0-9.]*)$"); // It does not match negative values

export const playbackSpeedRegex = new RegExp("^speed: *([0-9.]*)$");

export const loopRegex = new RegExp("^loop: *(True|False)$", "i");

export const layoutRegex = new RegExp("^layout: *([0-9])$", "i");

export const stickyRegex = new RegExp("^sticky: *(True|False)$", "i");

export const titleRegex = new RegExp("^title: *(.*)$");

export const decimalsRegex = new RegExp("^decimals: *([0-2])$", "i");

export const autoplayRegex = new RegExp("^autoplay: *(True|False)$", "i");

export const unstoppableRegex = new RegExp("^unstoppable: *(True|False)$", "i");

export const idRegex = new RegExp("^#(\\S{16}) *$");

/* ---------------- */
/* --- Comments --- */
/* ---------------- */
export const commentNativeRegex = new RegExp("^(.+) --- (.+)$");
export const commentLCRegex = new RegExp(
	"^\\[(\\d{2,}:\\d{2}.\\d{1,3})\\](.+)$"
);
