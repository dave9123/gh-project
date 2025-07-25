"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, MessageCircle, Package, ArrowLeft } from "lucide-react";
import { OrderProductUI } from "@/components/order-product-ui";
import { FormDataT } from "@/lib/product";

type BusinessEntity = {
  business: {
    name: string;
    slug: string;
    id: number;
  };
  products: {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    currencyType: string;
    businessId: number;
    createdAt: string;
    lastModified: string;
    formData: FormDataT;
  }[];
};

export function BusinessWelcomeClient({
  businessData,
}: {
  businessData: BusinessEntity;
}) {
  const [showProducts, setShowProducts] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<
    BusinessEntity["products"][0] | null
  >(null);

  // If a specific product is selected, show the order configuration
  if (selectedProduct) {
    return (
      <OrderProductUI
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  if (showProducts) {
    return (
      <ProductsView
        businessData={businessData}
        onBack={() => setShowProducts(false)}
        onSelectProduct={setSelectedProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to {businessData.business.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover our amazing products or chat with our AI assistant to find
            exactly what you need.
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <BusinessActionButton
            title="Discover Products"
            description="Browse our full product catalog"
            icon={<ShoppingBag className="h-8 w-8" />}
            action="products"
            onClick={() => setShowProducts(true)}
          />

          <BusinessActionButton
            title="Chat with AI"
            description="Get personalized recommendations"
            icon={<MessageCircle className="h-8 w-8" />}
            action="chat"
            onClick={() => {
              // Navigate to chat - you can implement this based on your routing
              window.location.href = `/chat?business=${businessData.business.slug}`;
            }}
          />
        </div>

        {/* Business Info */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            <Package className="mr-1 h-3 w-3" />
            {businessData.products.length} Product
            {businessData.products.length !== 1 ? "s" : ""} Available
          </Badge>
        </div>
      </div>
    </div>
  );
}

function BusinessActionButton({
  title,
  description,
  icon,
  action,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: "products" | "chat";
  onClick: () => void;
}) {
  return (
    <Card
      className="w-full max-w-sm hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" size="lg">
          {action === "products" ? "View Products" : "Start Chat"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductsView({
  businessData,
  onBack,
  onSelectProduct,
}: {
  businessData: BusinessEntity;
  onBack: () => void;
  onSelectProduct: (product: BusinessEntity["products"][0]) => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Button variant="outline" onClick={onBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {businessData.business.name} Products
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {businessData.products.length} product
              {businessData.products.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessData.products.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-primary">
                    {product.currencyType} {product.basePrice.toFixed(2)}
                  </div>
                  <Button size="sm" onClick={() => onSelectProduct(product)}>
                    Configure Order
                  </Button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Added: {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    Updated:{" "}
                    {new Date(product.lastModified).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {businessData.products.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              This business hasn't added any products yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
