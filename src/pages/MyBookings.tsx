import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Plane, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";

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

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
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
        {[1, 2].map((i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-6">
              <Skeleton className="h-32" />
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
          {bookings.map((booking) => (
            <Card key={booking.bookingID} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Header: Mã booking + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                    <p className="text-lg font-bold text-blue-600">
                      {Number(booking.totalAmount).toLocaleString("vi-VN")} VND
                    </p>
                  </div>

                  {/* Flight Info */}
                  {booking.flight && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        {/* Departure */}
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold">
                            {formatTime(booking.flight.scheduledDeparture)}
                          </p>
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.flight.departureAirport?.city}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {booking.flight.departureAirport?.iataCode}
                          </p>
                        </div>

                        {/* Flight path */}
                        <div className="flex flex-col items-center px-4">
                          <Plane className="h-5 w-5 text-blue-600 rotate-90" />
                          <div className="w-24 h-0.5 bg-blue-600 my-2" />
                          <p className="text-xs text-gray-500">
                            {booking.flight.flightID}
                          </p>
                        </div>

                        {/* Arrival */}
                        <div className="text-center flex-1">
                          <p className="text-2xl font-bold">
                            {formatTime(booking.flight.scheduledArrival)}
                          </p>
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.flight.arrivalAirport?.city}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {booking.flight.arrivalAirport?.iataCode}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(booking.flight.scheduledDeparture)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {booking.passengerCount ?? 0} khách
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Booking date + Cancel button */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-gray-500">
                      Đặt ngày: {formatDate(booking.bookDate)}
                    </p>
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