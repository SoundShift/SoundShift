"use client";

import { SpotifyProvider } from "@/providers/SpotifyProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpotifyProvider>{children}</SpotifyProvider>;
}
