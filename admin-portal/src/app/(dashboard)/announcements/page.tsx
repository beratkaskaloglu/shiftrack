"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import type { Announcement } from "@/lib/types";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Duyuru silindi");
  };

  const handleToggleActive = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, is_active: !a.is_active } : a
      )
    );
  };

  const handleSave = (announcement: Announcement) => {
    if (editing) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? announcement : a))
      );
      toast.success("Duyuru guncellendi");
    } else {
      setAnnouncements((prev) => [
        { ...announcement, id: `a${Date.now()}` },
        ...prev,
      ]);
      toast.success("Duyuru olusturuldu");
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Duyuru Yonetimi"
        description="Kullanici uygulamasinda gosterilen duyurulari yonetin"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-[#007FE2] hover:bg-[#0066b8]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Duyuru
          </Button>
        }
      />

      {announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">Henuz duyuru yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {a.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {a.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{a.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        Olusturan: {a.created_by}
                      </span>
                      <span>
                        {new Date(a.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      {a.updated_at !== a.created_at && (
                        <span>
                          Guncellendi:{" "}
                          {new Date(a.updated_at).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(a.id)}
                      title={a.is_active ? "Pasifle" : "Aktifle"}
                    >
                      {a.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(a);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <AnnouncementFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        announcement={editing}
        createdBy={user?.full_name || "Admin"}
        onSave={handleSave}
      />
    </div>
  );
}

function AnnouncementFormDialog({
  open,
  onClose,
  announcement,
  createdBy,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  createdBy: string;
  onSave: (announcement: Announcement) => void;
}) {
  const [form, setForm] = useState({
    title: announcement?.title || "",
    content: announcement?.content || "",
    image_url: announcement?.image_url || "",
    is_active: announcement?.is_active ?? true,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {announcement ? "Duyuru Duzenle" : "Yeni Duyuru"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              id: announcement?.id || "",
              title: form.title,
              content: form.content,
              image_url: form.image_url || null,
              is_active: form.is_active,
              created_by: announcement?.created_by || createdBy,
              created_at:
                announcement?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Baslik *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Duyuru basligi"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Icerik *</Label>
            <Textarea
              value={form.content}
              onChange={(e) =>
                setForm({ ...form, content: e.target.value })
              }
              placeholder="Duyuru icerigi..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Gorsel URL (opsiyonel)</Label>
            <Input
              value={form.image_url}
              onChange={(e) =>
                setForm({ ...form, image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <Label htmlFor="active">Aktif olarak yayinla</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              {announcement ? "Guncelle" : "Yayinla"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
