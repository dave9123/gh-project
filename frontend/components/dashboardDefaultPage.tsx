"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currencyType: string;
}

export default function DashboardDefaultPage() {
  const hasFetched = useRef(false);
  const [category, setCategory] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<
    string | number | readonly string[] | undefined
  >("");
  const [categoryDescription, setCategoryDescription] = useState<
    string | number | readonly string[] | undefined
  >("");
  const [basePrice, setBasePrice] = useState("");
  const [currency, setCurrency] = useState("");

  async function saveCategory() {
    //checks if the base price is a valid number
    if (isNaN(parseFloat(basePrice)) || basePrice.trim() === "") {
      alert("Please enter a valid base price.");
      return;
    }

    try {
      const response = await fetch("/api/business/product/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
          basePrice: parseFloat(basePrice),
          currencyType: currency,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save category");
      }

      // Assuming the API returns the created product with an id
      if (!data.product || !data.product.id) {
        throw new Error("Product creation failed, no ID returned");
      }

      // Update the local state with the new category
      setCategory([
        ...category,
        {
          ...data.product,
        },
      ]);
    } catch (error) {
      // console.error("Error saving category:", error);
      // alert("An error occurred while saving the category.");
      return;
    }
  }

  async function FetchProducts() {
    try {
      const response = await fetch("/api/business/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();

      console.log("Fetched products:", data.products);
      setCategory(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      FetchProducts();
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Product List</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">+</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a new product category</DialogTitle>
                    <DialogDescription>Make bla bla bla</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="category-name">
                        Category Name
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="category-name"
                        name="category-name"
                        placeholder="Enter category name"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="category-description">
                        Category Description
                      </Label>
                      <Textarea
                        id="category-description"
                        name="category-description"
                        placeholder="Enter category description"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                      />
                    </div>{" "}
                    <div className="grid gap-3">
                      <Label htmlFor="base-price">Base Price</Label>
                      <Textarea
                        id="base-price"
                        name="base-price"
                        placeholder="Enter base price"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="currency">Currency</Label>
                      <Select onValueChange={setCurrency}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="idr">IDR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={saveCategory}>
                      Save category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4 space-y-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {category.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{item.name}</CardTitle>
                    <CardDescription className="text-md text-muted-foreground">
                      {item.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Base Price: {item.basePrice}</p>
                    <p>Currency: {item.currencyType}</p>
                  </CardContent>
                  <CardFooter>
                    {/* <Dialog>
                      <DialogTrigger asChild>
                        <Button>Details</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kaos</DialogTitle>
                          <DialogDescription>
                            kaos anak berkualitas tinggi dengan bla bla bla
                          </DialogDescription>
                        </DialogHeader>
                        <p>Base Price: $1.00</p>
                        <p>Currency: USD</p>
                        <p>Parameters:</p>
                        <div className="w-full border-2 rounded-md p-4 flex flex-col">
                          <div>Materials : select bla or bla</div>
                          <div>Materials : select bla or bla</div>
                          <div>Materials : select bla or bla</div>
                          <div>Materials : select bla or bla</div>
                        </div>
                      </DialogContent>
                    </Dialog> */}
                    <Link href={`/dashboard/products/${item.id}`}>
                      <Button variant="outline" className="ml-0">
                        Edit
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
