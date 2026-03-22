"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { MOCK_USERS } from "@/lib/mock-data";
import type { User, UserRole } from "@/lib/types";
import { getRoleLabel } from "@/lib/auth";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  Key,
} from "lucide-react";
import { toast } from "sonner";

const columnHelper = createColumnHelper<User>();

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("full_name", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Ad Soyad
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-medium text-gray-900">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("username", {
        header: "Kullanici Adi",
      }),
      columnHelper.accessor("email", {
        header: "E-posta",
        cell: (info) => (
          <span className="text-gray-500">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("platform", {
        header: "Platform",
        cell: (info) => (
          <Badge variant="outline">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("project", {
        header: "Proje",
        cell: (info) => (
          <Badge variant="secondary">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Rol",
        cell: (info) => {
          const role = info.getValue();
          const colors: Record<UserRole, string> = {
            super_admin: "bg-red-100 text-red-700",
            project_manager: "bg-blue-100 text-blue-700",
            supervisor: "bg-green-100 text-green-700",
          };
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role]}`}
            >
              {getRoleLabel(role)}
            </span>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Durum",
        cell: (info) => (
          <Badge variant={info.getValue() ? "default" : "secondary"}>
            {info.getValue() ? "Aktif" : "Pasif"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Islemler",
        cell: (info) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingUser(info.row.original);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUserId(info.row.original.id);
                setPasswordDialogOpen(true);
              }}
            >
              <Key className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(info.row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("Kullanici silindi");
  };

  const handleSave = (user: User) => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? user : u))
      );
      toast.success("Kullanici guncellendi");
    } else {
      setUsers((prev) => [...prev, { ...user, id: `u${Date.now()}` }]);
      toast.success("Kullanici olusturuldu");
    }
    setDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div>
      <PageHeader
        title="Kullanici Yonetimi"
        description="Personel CRUD, platform/proje/rol atamasi"
        actions={
          <Button
            onClick={() => {
              setEditingUser(null);
              setDialogOpen(true);
            }}
            className="bg-[#007FE2] hover:bg-[#0066b8]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanici
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Ara..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold text-gray-600"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Toplam {table.getFilteredRowModel().rows.length} kayit
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Onceki
            </Button>
            <span className="text-sm text-gray-600">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </div>

      {/* User Create/Edit Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSave}
      />

      {/* Password Change Dialog */}
      <PasswordDialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />
    </div>
  );
}

// ── User Form Dialog ─────────────────────────────────────────────────────────

function UserFormDialog({
  open,
  onClose,
  user,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
}) {
  const isEditing = !!user;
  const [form, setForm] = useState<Partial<User>>(
    user || {
      username: "",
      full_name: "",
      email: "",
      phone: "",
      platform: "",
      project: "",
      personnel_no: "",
      role: "supervisor",
      is_active: true,
    }
  );

  // Reset form when user changes
  useState(() => {
    if (user) setForm(user);
    else
      setForm({
        username: "",
        full_name: "",
        email: "",
        phone: "",
        platform: "",
        project: "",
        personnel_no: "",
        role: "supervisor",
        is_active: true,
      });
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: user?.id || "",
      username: form.username || "",
      full_name: form.full_name || "",
      email: form.email || "",
      phone: form.phone || "",
      platform: form.platform || "",
      project: form.project || "",
      personnel_no: form.personnel_no || "",
      role: (form.role as UserRole) || "supervisor",
      is_active: form.is_active ?? true,
      created_at: user?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Kullaniciyi Duzenle" : "Yeni Kullanici"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Ad Soyad</Label>
              <Input
                value={form.full_name || ""}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Kullanici Adi</Label>
              <Input
                value={form.username || ""}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input
                value={form.phone || ""}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Platform</Label>
              <Input
                value={form.platform || ""}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value })
                }
                placeholder="PX, ES..."
              />
            </div>
            <div className="space-y-1">
              <Label>Proje</Label>
              <Input
                value={form.project || ""}
                onChange={(e) =>
                  setForm({ ...form, project: e.target.value })
                }
                placeholder="SEPHORA, ZARA..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Personel No</Label>
              <Input
                value={form.personnel_no || ""}
                onChange={(e) =>
                  setForm({ ...form, personnel_no: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select
                value={form.role || "supervisor"}
                onValueChange={(v) =>
                  setForm({ ...form, role: v as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="project_manager">
                    Proje Yoneticisi
                  </SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active ?? true}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              {isEditing ? "Guncelle" : "Olustur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Password Dialog ──────────────────────────────────────────────────────────

function PasswordDialog({
  open,
  onClose,
  userId: _userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Sifreler eslesmiyorr");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Sifre en az 6 karakter olmali");
      return;
    }
    toast.success("Sifre guncellendi");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sifre Degistir</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Yeni Sifre</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Sifre Tekrar</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              Guncelle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
