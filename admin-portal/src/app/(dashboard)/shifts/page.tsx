"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// Card components available if needed
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  MOCK_SHIFTS,
  MOCK_SHIFT_ASSIGNMENTS,
  MOCK_USERS,
} from "@/lib/mock-data";
import type { Shift, ShiftAssignment, ShiftType } from "@/lib/types";
import { Plus, Clock, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const shiftColumnHelper = createColumnHelper<Shift>();
const assignmentColumnHelper = createColumnHelper<ShiftAssignment>();

const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  A: "bg-blue-100 text-blue-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-purple-100 text-purple-700",
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [assignments, setAssignments] =
    useState<ShiftAssignment[]>(MOCK_SHIFT_ASSIGNMENTS);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const shiftColumns = useMemo(
    () => [
      shiftColumnHelper.accessor("name", {
        header: "Vardiya Adi",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      shiftColumnHelper.accessor("type", {
        header: "Tip",
        cell: (info) => (
          <Badge className={SHIFT_TYPE_COLORS[info.getValue()]}>
            {info.getValue()}
          </Badge>
        ),
      }),
      shiftColumnHelper.accessor("start_time", {
        header: "Baslangic",
        cell: (info) => (
          <span className="font-mono text-gray-600">{info.getValue()}</span>
        ),
      }),
      shiftColumnHelper.accessor("end_time", {
        header: "Bitis",
        cell: (info) => (
          <span className="font-mono text-gray-600">{info.getValue()}</span>
        ),
      }),
      shiftColumnHelper.accessor("project", {
        header: "Proje",
        cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
      }),
      shiftColumnHelper.display({
        id: "actions",
        header: "Islemler",
        cell: (info) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingShift(info.row.original);
                setShiftDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShifts((prev) =>
                  prev.filter((s) => s.id !== info.row.original.id)
                );
                toast.success("Vardiya silindi");
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  const assignmentColumns = useMemo(
    () => [
      assignmentColumnHelper.accessor("personnel_name", {
        header: "Personel",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      assignmentColumnHelper.accessor("shift_name", {
        header: "Vardiya",
      }),
      assignmentColumnHelper.accessor("start_date", {
        header: "Baslangic Tarihi",
        cell: (info) => new Date(info.getValue()).toLocaleDateString("tr-TR"),
      }),
      assignmentColumnHelper.accessor("end_date", {
        header: "Bitis Tarihi",
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue()!).toLocaleDateString("tr-TR")
            : "Devam Ediyor",
      }),
      assignmentColumnHelper.display({
        id: "actions",
        header: "Islemler",
        cell: (info) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAssignments((prev) =>
                prev.filter((a) => a.id !== info.row.original.id)
              );
              toast.success("Atama kaldirildi");
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        ),
      }),
    ],
    []
  );

  const shiftTable = useReactTable({
    data: shifts,
    columns: shiftColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const assignmentTable = useReactTable({
    data: assignments,
    columns: assignmentColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <PageHeader
        title="Vardiya Yonetimi"
        description="Vardiya olusturma, personel atama ve saat duzenleme"
      />

      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts" className="gap-2">
            <Clock className="h-4 w-4" />
            Vardiyalar
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Atamalar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingShift(null);
                setShiftDialogOpen(true);
              }}
              className="bg-[#007FE2] hover:bg-[#0066b8]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Vardiya
            </Button>
          </div>
          <DataTable table={shiftTable} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setAssignDialogOpen(true)}
              className="bg-[#007FE2] hover:bg-[#0066b8]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Atama
            </Button>
          </div>
          <DataTable table={assignmentTable} />
        </TabsContent>
      </Tabs>

      {/* Shift Create/Edit Dialog */}
      <ShiftFormDialog
        open={shiftDialogOpen}
        onClose={() => {
          setShiftDialogOpen(false);
          setEditingShift(null);
        }}
        shift={editingShift}
        onSave={(shift) => {
          if (editingShift) {
            setShifts((prev) =>
              prev.map((s) => (s.id === shift.id ? shift : s))
            );
            toast.success("Vardiya guncellendi");
          } else {
            setShifts((prev) => [
              ...prev,
              { ...shift, id: `s${Date.now()}` },
            ]);
            toast.success("Vardiya olusturuldu");
          }
          setShiftDialogOpen(false);
          setEditingShift(null);
        }}
      />

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        shifts={shifts}
        onSave={(assignment) => {
          setAssignments((prev) => [
            ...prev,
            { ...assignment, id: `sa${Date.now()}` },
          ]);
          toast.success("Atama yapildi");
          setAssignDialogOpen(false);
        }}
      />
    </div>
  );
}

// ── Generic Data Table ───────────────────────────────────────────────────────

function DataTable({ table }: { table: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          {table.getHeaderGroups().map((hg: any) => (
            <tr key={hg.id}>
              {hg.headers.map((header: any) => (
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
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={100}
                className="px-4 py-8 text-center text-gray-400"
              >
                Kayit bulunamadi
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row: any) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Shift Form Dialog ────────────────────────────────────────────────────────

function ShiftFormDialog({
  open,
  onClose,
  shift,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSave: (shift: Shift) => void;
}) {
  const [form, setForm] = useState({
    name: shift?.name || "",
    type: shift?.type || ("A" as ShiftType),
    start_time: shift?.start_time || "06:00",
    end_time: shift?.end_time || "14:00",
    project: shift?.project || "",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Vardiya Duzenle" : "Yeni Vardiya"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              id: shift?.id || "",
              ...form,
              created_at: shift?.created_at || new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Vardiya Adi</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Sabah Vardiyasi"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tip</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v as ShiftType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (Sabah)</SelectItem>
                  <SelectItem value="B">B (Aksam)</SelectItem>
                  <SelectItem value="C">C (Gece)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Proje</Label>
              <Input
                value={form.project}
                onChange={(e) =>
                  setForm({ ...form, project: e.target.value })
                }
                placeholder="SEPHORA"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Baslangic Saati</Label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Bitis Saati</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              {shift ? "Guncelle" : "Olustur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Assignment Dialog ────────────────────────────────────────────────────────

function AssignmentDialog({
  open,
  onClose,
  shifts,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  onSave: (assignment: ShiftAssignment) => void;
}) {
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [startDate, setStartDate] = useState("");

  const personnel = MOCK_USERS.filter((u) => u.is_active);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Vardiya Atamasi</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const shift = shifts.find((s) => s.id === selectedShift);
            const person = personnel.find((p) => p.id === selectedPersonnel);
            if (!shift || !person) return;
            onSave({
              id: "",
              shift_id: shift.id,
              shift_name: `${shift.name} (${shift.type})`,
              personnel_id: person.id,
              personnel_name: person.full_name,
              start_date: startDate,
              end_date: null,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Vardiya</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger>
                <SelectValue placeholder="Vardiya secin" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.type}) - {s.project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Personel</Label>
            <Select
              value={selectedPersonnel}
              onValueChange={setSelectedPersonnel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Personel secin" />
              </SelectTrigger>
              <SelectContent>
                {personnel.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} - {p.project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Baslangic Tarihi</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              Ata
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
