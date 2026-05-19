export const FOOD_IMAGE_UPLOAD_LIMIT_LABEL = "2MB";
export const MAX_FOOD_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_FOOD_IMAGE_VALUE_LENGTH = 3_000_000;

export function getFoodImageTooLargeMessage() {
  return `Uploaded image is too large. Please use an image up to ${FOOD_IMAGE_UPLOAD_LIMIT_LABEL}.`;
}

export function isFoodImageValueTooLarge(image: string) {
  return image.length > MAX_FOOD_IMAGE_VALUE_LENGTH;
}
