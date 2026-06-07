"use client";

import * as React from "react";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

const EMPTY_FORM = { name: "", email: "", role: "User", status: "Active" };

function statusClass(status: string) {
  if (status === "Active") return "border-green-500 text-green-600 dark:text-green-400";
  if (status === "Pending") return "border-yellow-500 text-yellow-600 dark:text-yellow-400";
  return "border-muted-foreground text-muted-foreground";
}

export function UsersTable({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  function openAdd() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Update failed");
        }
        const updated: User = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast.success("User updated");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Create failed");
        }
        const created: User = await res.json();
        setUsers((prev) => [...prev, created]);
        toast.success("User created");
      }
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Delete failed");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">{users.length} total</p>
        </div>
        <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <PlusIcon />
              Add User
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="gap-1">
              <DrawerTitle>{editingUser ? "Edit User" : "Add User"}</DrawerTitle>
              <DrawerDescription>
                {editingUser ? "Update the user's details." : "Fill in the details to create a new user."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-name">Name</Label>
                <Input
                  id="u-name"
                  placeholder="Alice Johnson"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-email">Email</Label>
                <Input
                  id="u-email"
                  type="email"
                  placeholder="alice@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v ?? f.role }))}
                  items={[
                    { label: "User", value: "User" },
                    { label: "Admin", value: "Admin" },
                    { label: "Moderator", value: "Moderator" },
                  ]}
                >
                  <SelectTrigger id="u-role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Moderator">Moderator</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v ?? f.status }))}
                  items={[
                    { label: "Active", value: "Active" },
                    { label: "Inactive", value: "Inactive" },
                    { label: "Pending", value: "Pending" },
                  ]}
                >
                  <SelectTrigger id="u-status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editingUser ? "Save Changes" : "Create User"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found. Click "Add User" to create one.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="px-1.5 text-muted-foreground">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(user)}
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={deletingId === user.id}
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
