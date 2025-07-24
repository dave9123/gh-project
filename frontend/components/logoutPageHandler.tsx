"use client";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function LogoutPageHandler({
  session,
}: {
  session: Session | null;
}) {
  const { status } = useSession();
  const router = useRouter();
  const hasRedirected = React.useRef(false);

  useEffect(() => {
    console.log(status);

    if (hasRedirected.current) return;

    hasRedirected.current = true;
    if (status == "unauthenticated") {
      router.push("/login");
    }

    console.log("session", session);
    if (session) {
      signOut({ callbackUrl: "/login" });
    }
  }, [status]);

  return <span />;
}
