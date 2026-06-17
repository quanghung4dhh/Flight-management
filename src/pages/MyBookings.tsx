import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Ticket } from "lucide-react";

export default function MyBookings() {
  const { t } = useTranslation();
  const { data: bookings, isLoading } = trpc.booking.myBookings.useQuery();
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            <Card key={booking.id} className="overflow-hidden">
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
                          {booking.bookingCode}
                        </span>
                      </span>
                    </div>

                    {booking.flight && (
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xl font-bold">
                            {formatTime(booking.flight.scheduledDeparture)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.flight.route?.departureAirport?.code}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(booking.flight.scheduledDeparture)}
                          </p>
                        </div>

                        <div className="flex flex-col items-center px-4">
                          <p className="text-xs text-gray-500">
                            {booking.flight.flightNumber}
                          </p>
                          <div className="flex items-center my-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            <div className="w-12 h-0.5 bg-blue-600 mx-1" />
                            <Plane className="h-3 w-3 text-blue-600" />
                            <div className="w-12 h-0.5 bg-blue-600 mx-1" />
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          </div>
                        </div>

                        <div>
                          <p className="text-xl font-bold">
                            {formatTime(booking.flight.scheduledArrival)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.flight.route?.arrivalAirport?.code}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(booking.flight.scheduledArrival)}
                          </p>
                        </div>
                      </div>
                    )}

                    {booking.tickets && booking.tickets.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.tickets.map(ticket => (
                          <Badge
                            key={ticket.id}
                            variant="outline"
                            className="text-xs"
                          >
                            <Ticket className="h-3 w-3 mr-1" />
                            {ticket.passengerName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:text-right flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-end gap-2">
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {Number(booking.totalAmount).toLocaleString("vi-VN")}{" "}
                        VND
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.paymentStatus}
                      </p>
                    </div>
                    {booking.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => cancelBooking.mutate({ id: booking.id })}
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
