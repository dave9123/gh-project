import { getServerSession } from "next-auth";
import { BusinessWelcomeClient } from "./components/BusinessWelcomeClient";
import { ProductTypes } from "@/lib/product";
import { EmptyState } from "@/components/ui/empty-state";

type BusinessEntity = {
  business: {
    name: string;
    slug: string;
    id: number;
  };
  products: ProductTypes[];
};
async function getBusinessData(
  OrderPageSlug: string
): Promise<BusinessEntity | undefined> {
  try {
    // console.log(`${process.env.BACKEND_URL}/api/business/get`, backEndJWT);
    const response = await fetch(
      `${process.env.BACKEND_URL}/public/get-slug/${OrderPageSlug}`,
      {
        method: "GET",
        headers: {
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
    return data;
  } catch (error) {
    console.error("Error fetching team data:", error);
    return undefined;
  }
}
export default async function OrderPageSlug({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { "business-slug": string };
}>) {
  const { "business-slug": businessSlug } = await params;
  const businessData = await getBusinessData(businessSlug);
  console.log("businessData", businessData);

  console.log("OrderPageSlug params:", businessData);
  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          title="Business not found"
          description="We couldn't find the business you were looking for."
        />
      </div>
    );
  }

  if (businessData) {
    return (
      <BusinessWelcomeClient businessData={businessData}>
        {children}
      </BusinessWelcomeClient>
    );
  }
}
