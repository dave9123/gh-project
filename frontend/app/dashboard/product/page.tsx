import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      </div>
      {/* Add your product management components here */}
    </div>
  );
}
