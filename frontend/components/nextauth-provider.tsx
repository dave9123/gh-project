"use client";
import { Session } from "inspector/promises";
import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

export default function NextAuthProvider({
  children,
  initialSession,
}: PropsWithChildren & {
  initialSession?: Session | null;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
