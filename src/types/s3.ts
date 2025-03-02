// Resposta de uma operação PutObject (upload)
export interface S3UploadResponse {
  ETag: string;
  Location?: string;
  Key: string;
  Bucket: string;
}

// Configuração para upload de arquivo no S3
export interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer | string;
  ContentType?: string;
}
