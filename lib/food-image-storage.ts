import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getFoodImageTooLargeMessage,
  MAX_FOOD_IMAGE_UPLOAD_BYTES,
} from "./food-image-input";

const FOOD_UPLOADS_PUBLIC_PREFIX = "/uploads/foods";
const FOOD_IMAGE_DATA_URL_PATTERN =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/;

const FOOD_IMAGE_MIME_EXTENSION_MAP: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const FOOD_IMAGE_TOO_LARGE_ERROR = "FOOD_IMAGE_TOO_LARGE";
const UNSUPPORTED_FOOD_IMAGE_TYPE_ERROR = "UNSUPPORTED_FOOD_IMAGE_TYPE";

function getFoodUploadsDirPath() {
  return path.resolve(process.cwd(), "public", "uploads", "foods");
}

function getManagedFoodUploadPath(image: string) {
  if (!image.startsWith(`${FOOD_UPLOADS_PUBLIC_PREFIX}/`)) {
    return null;
  }

  const uploadsDirPath = getFoodUploadsDirPath();
  const resolvedPath = path.resolve(
    process.cwd(),
    "public",
    image.replace(/^\//, "")
  );

  if (!resolvedPath.startsWith(`${uploadsDirPath}${path.sep}`)) {
    return null;
  }

  return resolvedPath;
}

export function getFoodImageStorageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === FOOD_IMAGE_TOO_LARGE_ERROR) {
    return getFoodImageTooLargeMessage();
  }

  if (error.message === UNSUPPORTED_FOOD_IMAGE_TYPE_ERROR) {
    return "Unsupported image format. Please use JPG, PNG, WEBP, GIF, or AVIF.";
  }

  return null;
}

export function isInlineFoodImageDataUrl(image: string) {
  return FOOD_IMAGE_DATA_URL_PATTERN.test(image.trim());
}

export async function persistFoodImageValue(image: string) {
  const trimmedImage = image.trim();
  const dataUrlMatch = FOOD_IMAGE_DATA_URL_PATTERN.exec(trimmedImage);

  if (!dataUrlMatch) {
    return trimmedImage;
  }

  const [, mimeType, base64Payload] = dataUrlMatch;
  const normalizedMimeType = mimeType.toLowerCase();
  const fileExtension = FOOD_IMAGE_MIME_EXTENSION_MAP[normalizedMimeType];

  if (!fileExtension) {
    throw new Error(UNSUPPORTED_FOOD_IMAGE_TYPE_ERROR);
  }

  const imageBuffer = Buffer.from(base64Payload, "base64");

  if (
    imageBuffer.byteLength === 0 ||
    imageBuffer.byteLength > MAX_FOOD_IMAGE_UPLOAD_BYTES
  ) {
    throw new Error(FOOD_IMAGE_TOO_LARGE_ERROR);
  }

  const uploadsDirPath = getFoodUploadsDirPath();
  await mkdir(uploadsDirPath, { recursive: true });

  const filename = `${crypto.randomUUID()}.${fileExtension}`;
  await writeFile(path.join(uploadsDirPath, filename), imageBuffer);

  return `${FOOD_UPLOADS_PUBLIC_PREFIX}/${filename}`;
}

export async function removeManagedFoodUpload(image: string | null | undefined) {
  if (!image) {
    return;
  }

  const managedPath = getManagedFoodUploadPath(image.trim());

  if (!managedPath) {
    return;
  }

  try {
    await unlink(managedPath);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}
