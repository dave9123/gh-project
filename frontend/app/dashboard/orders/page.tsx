"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Utility function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Badge component
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-1.5 text-xs font-medium leading-normal transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-yellow-500 text-white",
        pending: "border-transparent bg-blue-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status Badge component
const statusBadgeVariants = cva(
  "inline-flex items-center gap-x-2.5 rounded-full bg-background px-2.5 py-1.5 text-xs border",
  {
    variants: {
      status: {
        success: "",
        error: "",
        default: "",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  leftLabel: string;
  rightLabel: string;
}

function StatusBadge({
  className,
  status,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftLabel,
  rightLabel,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        {LeftIcon && (
          <LeftIcon
            className={cn(
              "-ml-0.5 size-4 shrink-0",
              status === "success" && "text-emerald-600 dark:text-emerald-500",
              status === "error" && "text-red-600 dark:text-red-500"
            )}
          />
        )}
        {leftLabel}
      </span>
      <span className="h-4 w-px bg-border" />
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {RightIcon && <RightIcon className="-ml-0.5 size-4 shrink-0" />}
        {rightLabel}
      </span>
    </span>
  );
}

// Data Table Types
export type DataTableColumn<T> = {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  itemsPerPage?: number;
  showPagination?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
};

// Data Table Component
function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  searchable = true,
  searchPlaceholder = "Search transactions...",
  itemsPerPage = 10,
  showPagination = true,
  striped = false,
  hoverable = true,
  bordered = true,
  compact = false,
  loading = false,
  emptyMessage = "No transactions found",
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          const value = row[column.key];
          return value?.toString().toLowerCase().includes(search.toLowerCase());
        })
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) => {
          const rowValue = row[key as keyof T];
          return rowValue
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, search, columnFilters, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, showPagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (key: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  if (loading) {
    return (
      <div className={cn("w-full bg-card rounded-2xl", className)}>
        <div className="animate-pulse p-6">
          {searchable && <div className="mb-6 h-11 bg-muted rounded-2xl"></div>}
          <div className="border border-border overflow-hidden">
            <div className="bg-muted/30 h-14"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 border-t border-border bg-card"
              ></div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="h-4 bg-muted rounded w-48"></div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-muted rounded-2xl"></div>
              <div className="h-9 w-9 bg-muted rounded-2xl"></div>
              <div className="h-9 w-9 bg-muted rounded-2xl"></div>
              <div className="h-9 w-16 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full bg-card rounded-2xl",
        bordered && "border border-border",
        className
      )}
    >
      {searchable && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-border">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-2xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden bg-muted/30",
          searchable ? "rounded-b-2xl" : "rounded-2xl"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-muted/30">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "text-left font-medium text-muted-foreground bg-muted/30",
                      compact ? "px-4 py-3" : "px-6 py-4",
                      column.sortable &&
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                      column.width && `w-[${column.width}]`
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {column.header}
                        </span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={cn(
                                "h-3 w-3",
                                sortConfig.key === column.key &&
                                  sortConfig.direction === "asc"
                                  ? "text-primary"
                                  : "text-muted-foreground/40"
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 -mt-1",
                                sortConfig.key === column.key &&
                                  sortConfig.direction === "desc"
                                  ? "text-primary"
                                  : "text-muted-foreground/40"
                              )}
                            />
                          </div>
                        )}
                      </div>
                      {column.filterable && (
                        <div className="relative">
                          <Filter className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    {column.filterable && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={columnFilters[String(column.key)] || ""}
                          onChange={(e) =>
                            handleColumnFilter(
                              String(column.key),
                              e.target.value
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-1.5 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        />
                        {columnFilters[String(column.key)] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearColumnFilter(String(column.key));
                            }}
                            className="absolute right-2 top-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn(
                      "text-center text-muted-foreground bg-card",
                      compact ? "px-4 py-12" : "px-6 py-16"
                    )}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-4xl">💸</div>
                      <div className="font-medium">{emptyMessage}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-t border-border bg-card transition-colors",
                      striped && index % 2 === 0 && "bg-muted/20",
                      hoverable && "hover:bg-muted/30",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          "text-sm text-foreground",
                          compact ? "px-4 py-3" : "px-6 py-4"
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border-t border-border">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-input rounded-2xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNumber =
                  currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;

                if (pageNumber < 1 || pageNumber > totalPages) return null;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "px-3 py-2 text-sm border border-input rounded-2xl hover:bg-muted transition-colors",
                      currentPage === pageNumber &&
                        "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-input rounded-2xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Order interface
interface Order {
  id: string;
  fileId: string;
  formValues: any; // BSON data
  currency: string;
  total: number;
  status: "onboarding" | "in-process" | "shipping" | "shipped";
  // Additional fields for display purposes
  orderDate?: string;
  customerName?: string;
  customerEmail?: string;
  businessName?: string;
}

// Order List Component
function OrderList() {
  const [loading, setLoading] = useState(false);

  // Sample order data
  const orders: Order[] = [
    {
      id: "675f1a2b3c4d5e6f78901234",
      fileId: "file_abc123def456",
      formValues: {
        customerName: "John Smith",
        customerEmail: "john.smith@email.com",
        businessName: "TechCorp Solutions",
        items: [
          { name: "Product A", quantity: 2, price: 35000 },
          { name: "Product B", quantity: 1, price: 20000 },
        ],
      },
      currency: "IDR",
      total: 90000,
      status: "shipped",
      orderDate: "2024-01-15T10:30:00Z",
      customerName: "John Smith",
      customerEmail: "john.smith@email.com",
      businessName: "TechCorp Solutions",
    },
    {
      id: "675f1a2b3c4d5e6f78901235",
      fileId: "file_ghi789jkl012",
      formValues: {
        customerName: "Sarah Johnson",
        customerEmail: "sarah.j@email.com",
        businessName: "Creative Studios",
        items: [{ name: "Design Package", quantity: 1, price: 150000 }],
      },
      currency: "IDR",
      total: 150000,
      status: "shipping",
      orderDate: "2024-01-14T14:20:00Z",
      customerName: "Sarah Johnson",
      customerEmail: "sarah.j@email.com",
      businessName: "Creative Studios",
    },
    {
      id: "675f1a2b3c4d5e6f78901236",
      fileId: "file_mno345pqr678",
      formValues: {
        customerName: "Michael Brown",
        customerEmail: "m.brown@email.com",
        businessName: "Digital Marketing Pro",
        items: [
          { name: "Marketing Campaign", quantity: 1, price: 500000 },
          { name: "Additional Services", quantity: 2, price: 100000 },
        ],
      },
      currency: "IDR",
      total: 700000,
      status: "in-process",
      orderDate: "2024-01-13T09:15:00Z",
      customerName: "Michael Brown",
      customerEmail: "m.brown@email.com",
      businessName: "Digital Marketing Pro",
    },
    {
      id: "675f1a2b3c4d5e6f78901237",
      fileId: "file_stu901vwx234",
      formValues: {
        customerName: "Emily Davis",
        customerEmail: "emily.davis@email.com",
        businessName: "Fashion Forward",
        items: [{ name: "Custom Design", quantity: 1, price: 75000 }],
      },
      currency: "IDR",
      total: 75000,
      status: "onboarding",
      orderDate: "2024-01-12T16:45:00Z",
      customerName: "Emily Davis",
      customerEmail: "emily.davis@email.com",
      businessName: "Fashion Forward",
    },
    {
      id: "675f1a2b3c4d5e6f78901238",
      fileId: "file_yza567bcd890",
      formValues: {
        customerName: "David Wilson",
        customerEmail: "d.wilson@email.com",
        businessName: "Home Essentials",
        items: [
          { name: "Home Package", quantity: 1, price: 250000 },
          { name: "Installation", quantity: 1, price: 50000 },
        ],
      },
      currency: "IDR",
      total: 300000,
      status: "shipped",
      orderDate: "2024-01-11T12:00:00Z",
      customerName: "David Wilson",
      customerEmail: "d.wilson@email.com",
      businessName: "Home Essentials",
    },
  ];

  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalItems = orders.reduce((sum, order) => {
    const items = order.formValues?.items || [];
    return sum + (Array.isArray(items) ? items.length : 0);
  }, 0);

  const formatCurrency = (amount: number, currency: string = "IDR") => {
    if (currency === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Shipped
          </Badge>
        );
      case "shipping":
        return (
          <Badge variant="pending" className="gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Shipping
          </Badge>
        );
      case "in-process":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" />
            In Process
          </Badge>
        );
      case "onboarding":
        return (
          <Badge variant="pending" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Onboarding
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns: DataTableColumn<Order>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-mono text-sm font-medium">
          {value.slice(0, 8)}...
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value || "N/A"}</div>
          <div className="text-xs text-muted-foreground">
            {row.customerEmail || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "businessName",
      header: "Business",
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total Amount",
      sortable: true,
      render: (value, row) => (
        <div className="font-semibold text-lg">
          {formatCurrency(value, row.currency)}
        </div>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      filterable: true,
      render: (value) => (
        <Badge variant="outline" className="gap-1">
          <DollarSign className="w-3 h-3" />
          {value}
        </Badge>
      ),
    },
    {
      key: "orderDate",
      header: "Order Date",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(value || "")}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      filterable: true,
      render: (value) => getOrderStatusBadge(value),
    },
    {
      key: "fileId",
      header: "File ID",
      filterable: true,
      render: (value) => (
        <div className="font-mono text-xs">
          {value ? `${value.slice(0, 12)}...` : "N/A"}
        </div>
      ),
    },
    {
      key: "formValues",
      header: "Items",
      render: (value) => {
        const items = value?.items || [];
        const itemCount = Array.isArray(items) ? items.length : 0;
        return (
          <div className="text-center font-medium">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </div>
        );
      },
    },
  ];

  const handleRowClick = (order: Order) => {
    console.log("Order details:", order);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track all customer orders including status, payments, and
          delivery information.
        </p>
      </div>

      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Overview</CardTitle>
            <CardDescription>
              Track order performance and revenue metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Revenue
                </div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(totalRevenue)}
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Orders
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalOrders.toLocaleString("en-US")}
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Items</div>
                <div className="text-2xl font-bold">
                  {totalItems.toLocaleString("en-US")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search by order number, customer name, or business..."
        itemsPerPage={10}
        showPagination={true}
        hoverable={true}
        loading={loading}
        onRowClick={handleRowClick}
        emptyMessage="No orders found"
      />
    </div>
  );
}

export default OrderList;
