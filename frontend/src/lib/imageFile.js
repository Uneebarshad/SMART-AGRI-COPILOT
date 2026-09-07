/**
 * Client-side image validation (frontend-spec.md §7.2, §19.1 rule 4): the
 * crop-photo rules live here, pure and shared, so any surface selecting a
 * photo (dropzone, drag-and-drop, the assistant hand-off) enforces the same
 * limits before anything is uploaded. Returns an i18n key naming the reason,
 * or null when the file is acceptable.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB (§7.2)

function checkType(file) {
  return ALLOWED_IMAGE_TYPES.includes(file.type) ? null : 'diagnosis.errorType';
}

function checkSize(file) {
  return file.size <= MAX_IMAGE_BYTES ? null : 'diagnosis.errorSize';
}

/** The file must actually decode as an image (§7.2 "must decode"). */
function checkDecodable(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
      .then((bitmap) => {
        bitmap.close();
        return null;
      })
      .catch(() => 'diagnosis.errorDecode');
  }
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('diagnosis.errorDecode');
    };
    probe.src = objectUrl;
  });
}

/** Resolves an i18n reason key (`diagnosis.error*`) or null when valid. */
export async function validateImageFile(file) {
  if (!file) return 'diagnosis.errorType';
  return checkType(file) ?? checkSize(file) ?? (await checkDecodable(file));
}
