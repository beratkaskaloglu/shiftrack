"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
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
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  MOCK_WORK_TASKS,
  MOCK_WORK_ASSIGNMENTS,
  MOCK_USERS,
} from "@/lib/mock-data";
import type {
  WorkTask,
  WorkAssignment,
  TaskStatus,
  TaskPriority,
} from "@/lib/types";
import {
  Plus,
  Search,
  ClipboardList,
  UserPlus,
  ArrowUpDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const taskColumnHelper = createColumnHelper<WorkTask>();
const assignmentColumnHelper = createColumnHelper<WorkAssignment>();

const PRIORITY_STYLES: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: "Dusuk", class: "bg-gray-100 text-gray-600" },
  medium: { label: "Orta", class: "bg-amber-100 text-amber-700" },
  high: { label: "Yuksek", class: "bg-red-100 text-red-700" },
};

const STATUS_STYLES: Record<TaskStatus, { label: string; class: string }> = {
  pending: { label: "Bekliyor", class: "bg-gray-100 text-gray-600" },
  in_progress: { label: "Devam Ediyor", class: "bg-blue-100 text-blue-700" },
  completed: { label: "Tamamlandi", class: "bg-green-100 text-green-700" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<WorkTask[]>(MOCK_WORK_TASKS);
  const [assignments, setAssignments] =
    useState<WorkAssignment[]>(MOCK_WORK_ASSIGNMENTS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);

  const taskColumns = useMemo(
    () => [
      taskColumnHelper.accessor("name", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Gorev Adi
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      taskColumnHelper.accessor("station_name", {
        header: "Istasyon",
        cell: (info) => info.getValue() || "\u2014",
      }),
      taskColumnHelper.accessor("priority", {
        header: "Oncelik",
        cell: (info) => {
          const p = PRIORITY_STYLES[info.getValue()];
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.class}`}>
              {p.label}
            </span>
          );
        },
      }),
      taskColumnHelper.accessor("target_duration_minutes", {
        header: "Hedef Sure",
        cell: (info) => {
          const mins = info.getValue();
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h > 0 ? `${h}sa ` : ""}${m}dk`;
        },
      }),
      taskColumnHelper.display({
        id: "actions",
        header: "Islemler",
        cell: (info) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingTask(info.row.original);
                setTaskDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTasks((prev) =>
                  prev.filter((t) => t.id !== info.row.original.id)
                );
                toast.success("Gorev silindi");
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
      assignmentColumnHelper.accessor("task_name", {
        header: "Gorev",
      }),
      assignmentColumnHelper.accessor("station_name", {
        header: "Istasyon",
        cell: (info) => info.getValue() || "\u2014",
      }),
      assignmentColumnHelper.accessor("status", {
        header: "Durum",
        cell: (info) => {
          const s = STATUS_STYLES[info.getValue()];
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.class}`}>
              {s.label}
            </span>
          );
        },
      }),
      assignmentColumnHelper.accessor("priority", {
        header: "Oncelik",
        cell: (info) => {
          const p = PRIORITY_STYLES[info.getValue()];
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.class}`}>
              {p.label}
            </span>
          );
        },
      }),
      assignmentColumnHelper.accessor("target_duration_minutes", {
        header: "Hedef",
        cell: (info) => `${info.getValue()} dk`,
      }),
      assignmentColumnHelper.accessor("actual_duration_minutes", {
        header: "Gercek",
        cell: (info) =>
          info.getValue() != null ? `${info.getValue()} dk` : "\u2014",
      }),
      assignmentColumnHelper.display({
        id: "progress",
        header: "Ilerleme",
        cell: (info) => {
          const row = info.row.original;
          if (row.status === "pending") return "\u2014";
          const target = row.target_duration_minutes;
          const actual = row.actual_duration_minutes || 0;
          const pct = Math.min(100, Math.round((actual / target) * 100));
          return (
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct > 100
                      ? "bg-red-500"
                      : pct > 80
                      ? "bg-amber-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{pct}%</span>
            </div>
          );
        },
      }),
      assignmentColumnHelper.display({
        id: "actions",
        header: "",
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

  const taskTable = useReactTable({
    data: tasks,
    columns: taskColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        title="Gorev Atama"
        description="Personele gorev atama, istasyon baglama, hedef sure belirleme"
      />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Gorevler
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Atamalar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Gorev ara..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setTaskDialogOpen(true);
              }}
              className="bg-[#007FE2] hover:bg-[#0066b8]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Gorev
            </Button>
          </div>
          <GenericTable table={taskTable} />
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
          <GenericTable table={assignmentTable} />
        </TabsContent>
      </Tabs>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={(task) => {
          if (editingTask) {
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? task : t))
            );
            toast.success("Gorev guncellendi");
          } else {
            setTasks((prev) => [
              ...prev,
              { ...task, id: `wt${Date.now()}` },
            ]);
            toast.success("Gorev olusturuldu");
          }
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
      />

      {/* Assignment Dialog */}
      <TaskAssignmentDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        tasks={tasks}
        onSave={(assignment) => {
          setAssignments((prev) => [
            ...prev,
            { ...assignment, id: `wa${Date.now()}` },
          ]);
          toast.success("Atama yapildi");
          setAssignDialogOpen(false);
        }}
      />
    </div>
  );
}

// ── Generic Table ────────────────────────────────────────────────────────────

function GenericTable({ table }: { table: any }) {
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
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
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

// ── Task Form Dialog ─────────────────────────────────────────────────────────

function TaskFormDialog({
  open,
  onClose,
  task,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  task: WorkTask | null;
  onSave: (task: WorkTask) => void;
}) {
  const [form, setForm] = useState({
    name: task?.name || "",
    description: task?.description || "",
    station_id: task?.station_id || "",
    station_name: task?.station_name || "",
    target_duration_minutes: task?.target_duration_minutes || 60,
    priority: task?.priority || ("medium" as TaskPriority),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? "Gorevi Duzenle" : "Yeni Gorev"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              id: task?.id || "",
              name: form.name,
              description: form.description,
              station_id: form.station_id || null,
              station_name: form.station_name || null,
              target_duration_minutes: form.target_duration_minutes,
              priority: form.priority,
              created_at: task?.created_at || new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Gorev Adi *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Aciklama</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Istasyon (opsiyonel)</Label>
              <Input
                value={form.station_name || ""}
                onChange={(e) =>
                  setForm({ ...form, station_name: e.target.value })
                }
                placeholder="Depo A - Istasyon 1"
              />
            </div>
            <div className="space-y-1">
              <Label>Hedef Sure (dk)</Label>
              <Input
                type="number"
                min={1}
                value={form.target_duration_minutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    target_duration_minutes: parseInt(e.target.value) || 60,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Oncelik</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm({ ...form, priority: v as TaskPriority })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Dusuk</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="high">Yuksek</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              {task ? "Guncelle" : "Olustur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Task Assignment Dialog ───────────────────────────────────────────────────

function TaskAssignmentDialog({
  open,
  onClose,
  tasks,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  tasks: WorkTask[];
  onSave: (assignment: WorkAssignment) => void;
}) {
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState("");

  const personnel = MOCK_USERS.filter((u) => u.is_active);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Gorev Atamasi</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const task = tasks.find((t) => t.id === selectedTask);
            const person = personnel.find((p) => p.id === selectedPersonnel);
            if (!task || !person) return;
            onSave({
              id: "",
              task_id: task.id,
              task_name: task.name,
              personnel_id: person.id,
              personnel_name: person.full_name,
              station_name: task.station_name,
              status: "pending",
              priority: task.priority,
              target_duration_minutes: task.target_duration_minutes,
              actual_duration_minutes: null,
              started_at: null,
              completed_at: null,
              assigned_at: new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Gorev *</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Gorev secin" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.station_name ? ` (${t.station_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Personel *</Label>
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
