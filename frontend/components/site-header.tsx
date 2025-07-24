import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

export function SiteHeader() {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-1">
        <SidebarTrigger className="-ml-1 block lg:hidden" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 block lg:hidden"
        />
        <div className="flex justify-center items-center gap-2 py-6">
          <div className=" inline-block">
            {/* <Image
              alt="Logo"
              src={Logo}
              width={25}
              height={25}
            /> */}
          </div>
          <span className=" font-semibold text-xl">Enterprise Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-2 cursor-pointer">
          <NavUser
            user={{
              name: "shadcn",
              email: "m@example.com",
              avatar: "/avatars/shadcn.jpg",
            }}
          />
        </div>
      </div>
    </header>
  );
}
