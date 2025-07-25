"use client";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import getBaseURL from "@/lib/getBaseURL";
import { AppStore, makeStore } from "@/redux/store";
import { Provider } from "react-redux";
import { CurrentBusinessState } from "@/redux/slices/currentBusinessSlice";

export default function ReduxProvider({
  children,
  initialSession,
  currentBusiness,
}: PropsWithChildren & {
  initialSession?: Session | null;
  currentBusiness: CurrentBusinessState | undefined;
}) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  const path = usePathname();

  async function handleSignOut() {
    await fetch(`${getBaseURL()}/api/signout`, {
      method: "POST",
    });
  }

  if (!storeRef.current) {
    storeRef.current = makeStore({
      session: initialSession,
      currentBusiness: currentBusiness,

      user: {
        ...initialSession?.user,
      },
    });
  }

  return <Provider store={storeRef.current}>{children} </Provider>;
}
