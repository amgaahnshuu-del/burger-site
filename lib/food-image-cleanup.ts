import { prisma } from "@/lib/prisma";
import { removeManagedFoodUpload } from "@/lib/food-image-storage";

export async function removeManagedFoodUploadIfUnused(
  image: string | null | undefined
) {
  if (!image?.trim()) {
    return;
  }

  const normalizedImage = image.trim();
  const [foodReferences, orderItemReferences] = await Promise.all([
    prisma.food.count({
      where: {
        image: normalizedImage,
      },
    }),
    prisma.orderItem.count({
      where: {
        foodImage: normalizedImage,
      },
    }),
  ]);

  if (foodReferences > 0 || orderItemReferences > 0) {
    return;
  }

  try {
    await removeManagedFoodUpload(normalizedImage);
  } catch {
    return;
  }
}
