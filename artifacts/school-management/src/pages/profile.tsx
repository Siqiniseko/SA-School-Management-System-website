import React, { useEffect, useState } from "react";
import {
  getGetMeQueryKey,
  getGetUserQueryKey,
  useUpdateUser,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { uploadFile } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Save, UserRound } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    profileImageUrl: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      email: user.email ?? "",
      phone: user.phone ?? "",
      profileImageUrl: user.profileImageUrl ?? "",
      password: "",
    });
    setImageFailed(false);
    setProfileFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }, [user]);

  if (!user) return null;

  const previewName = form.fullName || user.fullName;
  const photoPreview = previewUrl || form.profileImageUrl.trim();
  const canShowImage = photoPreview && !imageFailed;

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setProfileFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Choose an image file for your profile photo", variant: "destructive" });
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Profile photo must be 8MB or smaller", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setProfileFile(file);
    setImageFailed(false);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let profileImageUrl = form.profileImageUrl.trim() || null;
      if (profileFile) {
        const uploaded = await uploadFile(profileFile, "profiles");
        profileImageUrl = uploaded.url;
      }

      await updateUser.mutateAsync({
        id: user.id,
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          profileImageUrl,
          password: form.password.trim() || null,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(user.id) }),
      ]);

      setProfileFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
      setForm((current) => ({ ...current, password: "", profileImageUrl: profileImageUrl ?? "" }));
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Could not update profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and profile photo.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {canShowImage ? (
                <img
                  src={photoPreview}
                  alt={previewName}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span className="text-3xl font-bold">{initials(previewName) || "U"}</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold">{previewName}</p>
              <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
              <p className="text-sm text-muted-foreground">{form.email || "No email set"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={user.username} disabled />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Profile Photo
              </Label>
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
              {profileFile && <p className="text-xs text-muted-foreground">Selected: {profileFile.name}</p>}
            </div>

            <div className="space-y-1">
              <Label>Photo URL</Label>
              <Input
                type="url"
                value={form.profileImageUrl}
                onChange={(e) => {
                  setImageFailed(false);
                  setForm((current) => ({ ...current, profileImageUrl: e.target.value }));
                }}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
