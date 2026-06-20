import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket } from "lucide-react";

export default function MyBookings() {
  const { t } = useTranslation();
  const { data: bookings, isLoading } = trpc.booking.myBookings.useQuery();
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t("common.myBookings")}</h1>
        {[1, 2].map(i => (
          <Card key={i} className="mb-4">
            <CardContent className="p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("common.myBookings")}</h1>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có đặt vé nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <Card key={booking.bookingID} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Mã:{" "}
                        <span className="font-mono font-medium">
                          {booking.bookingID}
                        </span>
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Ngày đặt: {formatDate(booking.bookDate)}</p>
                      <p>
                        Số lượng hành khách: {booking.passengerCount ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="lg:text-right flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-end gap-2">
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {Number(booking.totalAmount).toLocaleString("vi-VN")}{" "}
                        VND
                      </p>
                    </div>
                    {booking.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() =>
                          cancelBooking.mutate({ id: booking.bookingID })
                        }
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
