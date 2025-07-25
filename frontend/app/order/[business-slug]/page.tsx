import { getServerSession } from "next-auth";

type BusinessEntity = {
  business: {
    name: string;
    slug: string;
    id: number;
  };
  products: [
    {
      id: number;
      name: string;
      description: string;
      basePrice: number;
      currencyType: string;
      businessId: number;
      createdAt: string;
      lastModified: string;
    }
  ];
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
  return <div>hey</div>;
}
