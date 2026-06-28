import { api } from './api';

export const uploadService = {
  async uploadReceipt(uri, fileName, fileType) {
    const formData = new FormData();
    formData.append('receipt', {
      uri,
      name: fileName,
      type: fileType,
    });
    return api.upload('/uploads/receipt', formData);
  },

  async getUploads() {
    return api.get('/uploads');
  },

  async deleteUpload(id) {
    return api.delete(`/uploads/${id}`);
  },
};
