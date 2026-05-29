import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/server-auth";
import { GalleryClient, type Photo } from "./GalleryClient";

export default async function GalleryPage() {
  const userId = await requireUserId();
  const rows = await prisma.photo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const initialPhotos: Photo[] = rows.map((r) => ({
    id: r.id,
    url: r.url,
    width: r.width,
    height: r.height,
    caption: r.caption,
  }));

  return <GalleryClient initialPhotos={initialPhotos} />;
}
