/**
 * Profile-photo helpers: browser-side validation and down-scaling.
 *
 * The avatar is stored as a small base64 data URL inside the user's existing
 * `preferences` JSON column — no new table, no filesystem, and it survives
 * serverless (Vercel) deployments because the database is the only store.
 * Resizing to 128px here keeps that value a few kilobytes.
 */

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // before down-scaling
export const AVATAR_SIZE_PX = 128;

/** Errors carry farmer-friendly messages; callers show `error.message` as-is. */
export function validateAvatarFile(file) {
  if (!file) return 'Choose an image file (JPG, PNG or WebP).';
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'That file type is not supported. Please use a JPG, PNG or WebP image.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'That image is too large. Please choose one under 5 MB.';
  }
  return null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be read. Please try another file.'));
    img.src = url;
  });
}

/**
 * Read, validate and re-render the file as a square 128px JPEG data URL
 * (center-cropped like `object-cover`). Rejects with a farmer-friendly Error.
 */
export async function resizeAvatarToDataUrl(file) {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (side <= 0) throw new Error('This image could not be read. Please try another file.');

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE_PX;
    canvas.height = AVATAR_SIZE_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image editing is not available in this browser.');
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE_PX,
      AVATAR_SIZE_PX,
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
