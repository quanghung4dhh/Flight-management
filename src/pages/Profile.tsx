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
import { User, Mail, Phone, Globe, CreditCard } from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [passport, setPassport] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-64" />
      </div>
    );
  }

  const user = userData;

  const handleSave = () => {
    updateProfile.mutate({
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      passport: passport || undefined,
      address: address || undefined,
      birthday: birthday || undefined,
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
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">
                {user?.username || "User"}
              </h2>
              <p className="text-sm text-gray-500">{user?.accountID}</p>
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
                defaultValue={user?.username || ""}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                defaultValue={user?.customer?.email || ""}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {t("common.phone")}
              </Label>
              <Input
                defaultValue={user?.customer?.phone || ""}
                onChange={e => setPhone(e.target.value)}
                placeholder="090xxxxxxx"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {t("common.passport")}
              </Label>
              <Input
                defaultValue={user?.customer?.passport || ""}
                onChange={e => setPassport(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Address
              </Label>
              <Input
                defaultValue={user?.customer?.address || ""}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {t("common.dateOfBirth")}
              </Label>
              <Input
                type="date"
                defaultValue={
                  user?.customer?.birthday
                    ? new Date(user.customer.birthday)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={e => setBirthday(e.target.value)}
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
