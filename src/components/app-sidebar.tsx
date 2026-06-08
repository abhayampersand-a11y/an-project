"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  Settings2Icon,
  UsersIcon,
  PackageIcon,
  FileTextIcon,
  IndianRupeeIcon,
  BookOpenIcon,
  ArchiveIcon,
  HardDriveIcon,
  ChevronRightIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { OmCastingLogo } from "@/components/om-casting-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  children?: { title: string; url: string }[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Setting",
    url: "#",
    icon: <Settings2Icon />,
    children: [
      { title: "City",  url: "/dashboard/setting/city" },
      { title: "State", url: "/dashboard/setting/state" },
    ],
  },
  {
    title: "Party",
    url: "/dashboard/party",
    icon: <UsersIcon />,
  },
  {
    title: "Item",
    url: "/dashboard/item",
    icon: <PackageIcon />,
  },
  {
    title: "Invoice",
    url: "#",
    icon: <FileTextIcon />,
    children: [
      { title: "Javak",  url: "#" },
      { title: "Aavak",  url: "#" },
      { title: "Garanu", url: "#" },
    ],
  },
  {
    title: "Payment",
    url: "/dashboard/payment",
    icon: <IndianRupeeIcon />,
  },
  {
    title: "Ledger",
    url: "#",
    icon: <BookOpenIcon />,
    children: [
      { title: "Party Tareej",    url: "#" },
      { title: "RS Rojmed",       url: "#" },
      { title: "Casting",         url: "#" },
      { title: "Fine Rojmed",     url: "#" },
      { title: "Fine Daily Rojmed", url: "#" },
      { title: "RS Daily Rojmed", url: "#" },
      { title: "Final Report",    url: "#" },
    ],
  },
  {
    title: "Manage",
    url: "#",
    icon: <ArchiveIcon />,
    children: [
      { title: "Account", url: "#" },
    ],
  },
  {
    title: "Backup",
    url: "#",
    icon: <HardDriveIcon />,
    children: [
      { title: "Javak", url: "#" },
      { title: "Aavak", url: "#" },
    ],
  },
]

const user = {
  name: "Admin",
  email: "admin@omcasting.com",
  avatar: "",
}

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.url !== "#" && pathname === item.url
  const hasChildren = item.children && item.children.length > 0
  const childActive = !!item.children?.some((c) => c.url === pathname)
  // Open if a child is the current route; otherwise honour manual toggling.
  const [open, setOpen] = React.useState(childActive)

  // Keep the group expanded after navigating to one of its children.
  React.useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  if (!item.children) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          render={<a href={item.url} />}
          className={
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
              : ""
          }
        >
          {item.icon}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() => setOpen((o) => !o)}
        className="justify-between"
      >
        <span className="flex items-center gap-2">
          {item.icon}
          <span>{item.title}</span>
        </span>
        <ChevronRightIcon
          className="ml-auto size-4 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </SidebarMenuButton>

      {hasChildren && open && (
        <SidebarMenuSub>
          {item.children!.map((child) => (
            <SidebarMenuSubItem key={child.title}>
              <SidebarMenuSubButton
                render={<a href={child.url} />}
                className={
                  pathname === child.url
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    : ""
                }
              >
                {child.title}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5! h-auto"
              render={<a href="/dashboard" />}
            >
              <OmCastingLogo
                className="text-sidebar-foreground [&>svg]:size-10"
                wordmarkClassName="text-2xl"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2 gap-1">
          {navItems.map((item) => (
            <NavItem key={item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
