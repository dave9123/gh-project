import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/next-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import LogoutPageHandler from "@/components/logoutPageHandler";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6">
      <LogoutPageHandler session={session} />
      <LoadingScreen
        message="Redirecting to login"
        secondaryMessage="Please wait while we redirect you to the login page, this helps us to keep your data secure."
      />
    </div>
  );
}
