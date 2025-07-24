"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Category = {
  id: string;
  name: string;
  description: string;
  base_price: number;
  currency: string;
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "base_price",
    header: "Base Price",
    //checks if the currency is USD or IDR and formats accordingly
    cell: (info) => {
      const value = info.getValue() as number;
      if (info.row.original.currency === "USD") {
        return `$${value.toFixed(2)}`;
      } else {
        return `Rp ${value.toLocaleString()}`;
      }
    },
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: (info) => info.getValue(),
  },
];
