import React, { useState } from "react";
import {
  useListNotifications, useCreateNotification, getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Plus } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  academic: "bg-green-100 text-green-700",
  financial: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminNotifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useListNotifications();
  const createNotification = useCreateNotification();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "general", targetRole: "all" });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const handleSave = async () => {
    if (!form.title || !form.message) { toast({ title: "Title and message are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await createNotification.mutateAsync({
        data: {
          title: form.title,
          message: form.message,
          type: form.type as any,
          targetRole: form.targetRole === "all" ? null : form.targetRole,
          sentBy: user?.id ?? null,
        },
      });
      toast({ title: "Notification sent" });
      refresh(); setOpen(false);
      setForm({ title: "", message: "", type: "general", targetRole: "all" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Send Notification</Button>
      </div>

      <div className="space-y-4">
        {isLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />) :
          notifications?.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications sent yet</CardContent></Card>
          ) :
          [...(notifications ?? [])].reverse().map(n => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    {n.title}
                  </CardTitle>
                  <div className="flex gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[n.type] ?? "bg-gray-100 text-gray-700"}`}>{n.type}</span>
                    {n.targetRole && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{n.targetRole}s</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Term 2 Start Date" />
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <Textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Enter your message here..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Send To</Label>
                <Select value={form.targetRole} onValueChange={v => setForm(f => ({ ...f, targetRole: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="learner">Learners</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="accountant">Accountants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Sending..." : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
