import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Product() {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter product name"
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="description">Description</Label>
          </div>
          <Input
            id="description"
            type="text"
            placeholder="Enter product description"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="base-price">Base Price</Label>
          </div>
          <Input
            id="base-price"
            type="number"
            placeholder="Enter product base price"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="currency">Currency</Label>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="idr">IDR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <Label>Parameters</Label>
          <div className="border-2 rounded-md p-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Add Parameter</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new parameter</DialogTitle>
                  <DialogDescription>
                    Add a new parameter to the product's quote price
                    calculation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="parameter-name">Parameter Name</Label>
                    <Input
                      id="parameter-name"
                      placeholder="Enter parameter name"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="parameter-value">Parameter Type</Label>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">Fixed Options</SelectItem>
                        <SelectItem value="idr">Numeric Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {/* Add your product management components here */}
    </div>
  );
}
