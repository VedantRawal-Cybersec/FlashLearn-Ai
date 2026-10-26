export const ALLOWED_HANDWRITING_TYPES = ["image/jpeg","image/png","image/webp"] as const;
export const MAX_HANDWRITING_BYTES = 2*1024*1024;
export function validateHandwritingImage(value:{type:string;size:number}):string|null {
  if(!ALLOWED_HANDWRITING_TYPES.includes(value.type as typeof ALLOWED_HANDWRITING_TYPES[number]))
    return "Use a PNG, JPEG, or WebP photo.";
  if(value.size<=0||value.size>MAX_HANDWRITING_BYTES)
    return "Choose a nonempty image smaller than 2 MB.";
  return null;
}
