self.onmessage = async (event) => {
	const { arrBuf } = event.data;
	const audioContext = new OfflineAudioContext(1, 44100 * 5, 44100); // Faster processing context

	try {
		const decodedBuffer = await audioContext.decodeAudioData(arrBuf);
		self.postMessage({ success: true, decodedBuffer });
	} catch (error) {
		self.postMessage({ success: false, error: error.message });
	}
};
