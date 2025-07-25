"use client";

import DashboardDefaultPage from "@/components/dashboardDefaultPage";
import OnboardingUI from "@/components/onboarding";
import { useAppSelector } from "@/redux/hooks";

export default function Page() {
  const currentBusiness = useAppSelector((state) => state.currentBusiness);

  if (!currentBusiness.ownerEmail) {
    return <OnboardingUI />;
  }

  return <DashboardDefaultPage />;
}
