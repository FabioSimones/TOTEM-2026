/** POST /api/admin/uploads/produtos/imagem — resposta do backend após salvar a imagem. */
export interface UploadImagemResponse {
  filename: string;
  url: string;
  contentType: string;
  size: number;
}
