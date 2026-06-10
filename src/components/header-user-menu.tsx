"use client"

import { LogOutIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfirm } from "@/components/confirm-dialog"
import { logout } from "@/app/login/actions"

/** CN avatar in the header. Clicking opens a menu; Log out asks to confirm. */
export function HeaderUserMenu() {
  const confirm = useConfirm()

  async function handleLogout() {
    const ok = await confirm({
      title: "Log out?",
      description: "You will be returned to the login screen.",
      confirmText: "Log out",
      cancelText: "Cancel",
      destructive: true,
    })
    if (ok) await logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="size-9 rounded-full p-0" />}
      >
        <Avatar className="size-8 rounded-full grayscale">
          <AvatarFallback className="rounded-full text-xs">CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-40">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
