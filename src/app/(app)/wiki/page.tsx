import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/server-auth";
import { WikiClient, type WikiPageMeta } from "./WikiClient";

export default async function WikiPage() {
  const userId = await requireUserId();
  const rows = await prisma.wikiPage.findMany({
    where: { userId },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      parentId: true,
      title: true,
      icon: true,
      updatedAt: true,
    },
  });
  const initialPages: WikiPageMeta[] = rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    title: r.title,
    icon: r.icon,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <WikiClient initialPages={initialPages} />;
}
