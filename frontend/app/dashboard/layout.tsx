import { AppSidebar } from "@/components/app-sidebar";
import ReduxProvider from "@/components/redux-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import getBaseURL from "@/lib/getBaseURL";
import { authOptions } from "@/lib/next-auth";
import { CurrentBusinessState } from "@/redux/slices/currentBusinessSlice";
import { getServerSession } from "next-auth";

async function getBusinessData(
  backEndJWT: string
): Promise<CurrentBusinessState | undefined> {
  try {
    // console.log(`${process.env.BACKEND_URL}/api/business/get`, backEndJWT);
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/business/get`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${backEndJWT}`,
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("responseresponse ");
    if (!response.ok) {
      // console.log("HEYYYA ");

      return undefined;
    }

    const data = await response.json();
    // console.log("datadata ", data);

    if (!data) {
      return undefined;
    }
    return data.business;
  } catch (error) {
    console.error("Error fetching team data:", error);
    return undefined;
  }
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  let currentBusinessData: CurrentBusinessState | undefined = undefined;

  if (session && session.backendJwt) {
    // console.log("SESSION ", session);
    const businessData = await getBusinessData(session.backendJwt);
    console.log(businessData);
    if (businessData) {
      currentBusinessData = businessData;
    }
  }

  return (
    <ReduxProvider
      currentBusiness={currentBusinessData}
      initialSession={session}
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </ReduxProvider>
  );
}
