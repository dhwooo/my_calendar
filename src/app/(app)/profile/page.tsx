import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/server-auth";
import { ProfileClient, type Profile } from "./ProfileClient";

export default async function ProfilePage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
    },
  });
  const google = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true },
  });

  const initialProfile: Profile = {
    user: user ?? {
      id: userId,
      name: null,
      username: null,
      image: null,
      email: null,
    },
    googleConnected: !!google,
  };

  return <ProfileClient initialProfile={initialProfile} />;
}
