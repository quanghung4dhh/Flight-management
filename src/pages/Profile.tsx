import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Calendar, Globe, CreditCard } from "lucide-react";

export default function Profile() {
  const { t } = useTranslation();
  const { data: userData, isLoading } = trpc.user.profile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idCard, setIdCard] = useState("");
  const [passport, setPassport] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const user = userData;
  const profile = user?.profile;

  const handleSave = () => {
    updateProfile.mutate({
      name: name || undefined,
      phone: phone || undefined,
      idCardNumber: idCard || undefined,
      passportNumber: passport || undefined,
      nationality: nationality || undefined,
      dateOfBirth: dateOfBirth || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("common.profile")}</h1>

      {/* User Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{user?.name || "User"}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <Badge variant="outline" className="mt-1">
                {user?.role === "admin" ? "Admin" : "Customer"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa thông tin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {t("common.name")}
              </Label>
              <Input
                defaultValue={user?.name || ""}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {t("common.phone")}
              </Label>
              <Input
                defaultValue={user?.phone || ""}
                onChange={e => setPhone(e.target.value)}
                placeholder="090xxxxxxx"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {t("common.idCard")}
              </Label>
              <Input
                defaultValue={profile?.idCardNumber || ""}
                onChange={e => setIdCard(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {t("common.passport")}
              </Label>
              <Input
                defaultValue={profile?.passportNumber || ""}
                onChange={e => setPassport(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {t("common.nationality")}
              </Label>
              <Input
                defaultValue={profile?.nationality || ""}
                onChange={e => setNationality(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t("common.dateOfBirth")}
              </Label>
              <Input
                type="date"
                defaultValue={
                  profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
                    : ""
                }
                onChange={e => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Đang lưu..." : t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
