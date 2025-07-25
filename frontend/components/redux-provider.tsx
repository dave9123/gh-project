"use client";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import getBaseURL from "@/lib/getBaseURL";
import { AppStore, makeStore } from "@/redux/store";
import { Provider } from "react-redux";

export default function ReduxProvider({
  children,
  initialSession,
}: PropsWithChildren & {
  initialSession?: Session | null;
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

      user: {
        ...initialSession?.user,
      },
    });
  }

  // useEffect(() => {
  //   if (initialSession) {
  //     store.dispatch(setSession(initialSession));
  //     if (userPermissions) {
  //       store.dispatch(setTeamPermission(userPermissions));
  //     }
  //   }
  //   // No dependencies: run once on mount
  //   // eslint-disable-next-line
  // }, []);

  return <Provider store={storeRef.current}>{children} </Provider>;
}
