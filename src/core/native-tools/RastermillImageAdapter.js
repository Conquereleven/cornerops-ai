class RastermillImageAdapter {
  async processImage() {
    return { toolId: 'rastermill', status: 'document_only', message: 'Rastermill is stubbed for future catalog image processing.' };
  }
}

module.exports = { RastermillImageAdapter };
