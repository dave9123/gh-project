import QuoteFormBuilder, {
  FormBuilderData,
} from "@/components/QuoteformBuilder";
import { EmptyState } from "@/components/ui/empty-state";
import { authOptions } from "@/lib/next-auth";
import { ProductTypes } from "@/lib/product";
import { IconBox } from "@tabler/icons-react";
import { OctagonAlertIcon } from "lucide-react";
import { getServerSession } from "next-auth";

async function getProductData(
  backEndJWT: string,
  productId: string
): Promise<
  (ProductTypes & { formData: FormBuilderData | undefined | null }) | undefined
> {
  try {
    // console.log(`${process.env.BACKEND_URL}/api/business/get`, backEndJWT);
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/business/product/${productId}`,
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
    console.log("datadata ", data);

    if (!data) {
      return undefined;
    }
    return data.product;
  } catch (error) {
    console.error("Error fetching team data:", error);
    return undefined;
  }
}

export default async function DashboardDefaultProductPage({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id: productId } = await params;
  const session = await getServerSession(authOptions);
  let productData: ProductTypes | undefined = undefined;
  if (session && session.backendJwt) {
    // console.log("SESSION ", session);
    const productDataResponse = await getProductData(
      session.backendJwt,
      productId
    );
    console.log(productDataResponse);

    if (productDataResponse) {
      productData = productDataResponse;
    }
  }

  if (productData === undefined) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <EmptyState
          title="Product not found"
          description="We couldn't find the product you were looking for."
        />
      </div>
    );
  }

  return (
    <div>
      <QuoteFormBuilder
        // @ts-ignore
        product={productData}
      />
    </div>
  );
}
