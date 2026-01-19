// lib/uploads/types.ts
export type UploadAttachment = {
  name: string;
  url: string;
  type: string;
  size?: number;
  meta?: Record<string, any>;
};

export type UploadError = {
  fileName: string;
  message: string;
};

export type UploadResult = {
  attachments: UploadAttachment[];
  errors: UploadError[];
};
