import { api } from "./api";
import type { UploadImagemResponse } from "../types/upload";

/** POST /api/admin/uploads/produtos/imagem — multipart/form-data, campo "file". */
export function uploadImagemProduto(file: File): Promise<UploadImagemResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<UploadImagemResponse>("/api/admin/uploads/produtos/imagem", formData);
}
