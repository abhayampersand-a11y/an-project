"use client"

import * as React from "react"
import Link from "next/link"
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

import { OmCastingLogo } from "@/components/om-casting-logo"
import {
  Sidebar,
  SidebarContent,
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
      { title: "Javak",  url: "/dashboard/invoice/javak" },
      { title: "Aavak",  url: "/dashboard/invoice/aavak" },
      { title: "Garanu", url: "/dashboard/invoice/garanu" },
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
      { title: "Party Tareej",    url: "/dashboard/ledger/party-tareej" },
      { title: "RS Rojmed",       url: "/dashboard/ledger/rs-rojmed" },
      { title: "Casting",         url: "#" },
      { title: "Fine Rojmed",     url: "/dashboard/ledger/fine-rojmed" },
      { title: "Fine Daily Rojmed", url: "/dashboard/ledger/fine-daily-rojmed" },
      { title: "RS Daily Rojmed", url: "/dashboard/ledger/rs-daily-rojmed" },
      { title: "Final Report",    url: "/dashboard/ledger/final-report" },
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
      { title: "Financial Year", url: "/dashboard/backup/financial-year" },
      { title: "Javak", url: "#" },
      { title: "Aavak", url: "#" },
    ],
  },
]

function NavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.url !== "#" && pathname === item.url
  const hasChildren = item.children && item.children.length > 0
  const childActive = !!item.children?.some((c) => c.url === pathname)
  // Open if a child is the current route; otherwise honour manual toggling.
  const [open, setOpen] = React.useState(childActive)

  // Expand the group when navigating into one of its children. Done during
  // render (not in an effect) to avoid synchronous-setState cascading renders.
  const [wasChildActive, setWasChildActive] = React.useState(childActive)
  if (childActive !== wasChildActive) {
    setWasChildActive(childActive)
    if (childActive) setOpen(true)
  }

  if (!item.children) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          render={<Link href={item.url} />}
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
                render={<Link href={child.url} />}
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
              render={<Link href="/dashboard" />}
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
    </Sidebar>
  )
}
