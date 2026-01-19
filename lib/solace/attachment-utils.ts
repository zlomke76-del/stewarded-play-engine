export function isImageAttachment(f: any): boolean {
  const mime = f?.mime || f?.type || "";
  const name = f?.name || "";
  return (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name)
  );
}

export function getAttachmentUrl(f: any): string | null {
  return f?.url || f?.publicUrl || f?.path || null;
}
