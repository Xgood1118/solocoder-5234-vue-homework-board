export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToBase64(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files)
  const results = await Promise.all(fileArray.map(fileToBase64))
  return results
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  if (!isImageFile(file)) {
    return { valid: false, error: '请上传图片文件' }
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `图片大小不能超过 ${maxSizeMB}MB` }
  }
  return { valid: true }
}

export function getFileNameFromBase64(base64: string, index: number): string {
  return `image_${index + 1}.png`
}
