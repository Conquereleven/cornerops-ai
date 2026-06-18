class FfmpegWasmMediaAdapter {
  async preprocessMedia() {
    return { toolId: 'ffmpeg-wasm', status: 'document_only', message: 'ffmpeg-wasm is stubbed for future voice-note preprocessing.' };
  }
}

module.exports = { FfmpegWasmMediaAdapter };
