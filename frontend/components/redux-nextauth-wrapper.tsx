"use client";
import { PropsWithChildren, useEffect, useRef } from "react";
// import { Provider } from "react-redux";
// import { AppStore, makeStore } from "./store";
import { Session } from "next-auth";
// import { TeamPermissionState } from "./slices/teamPermissoinSlice";
import { permission } from "process";
import { SessionProvider, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import getBaseURL from "@/lib/getBaseURL";

export default function ReduxNextAuthProvider({
  children,
}: //   userPermissions,
PropsWithChildren & {
  initialSession?: Session | null;
  //   userPermissions?: TeamPermissionState[];
}) {
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

  return <SessionProvider>{children}</SessionProvider>;
}
