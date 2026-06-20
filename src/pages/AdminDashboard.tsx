import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plane, Users, CreditCard, Ticket, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "flights" | "bookings"
  >("dashboard");
  const [flightPage, setFlightPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: revenue } = trpc.admin.revenueReport.useQuery({});
  const { data: flights, isLoading: flightsLoading } =
    trpc.admin.flightList.useQuery({
      page: flightPage,
      limit: 10,
    });
  const { data: bookings, isLoading: bookingsLoading } =
    trpc.admin.bookingList.useQuery({
      page: bookingPage,
      limit: 10,
    });

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000000).toFixed(1)}M`;
  };

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
    });
  };

  const formatDateTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      boarding: "bg-yellow-100 text-yellow-800",
      departed: "bg-green-100 text-green-800",
      delayed: "bg-orange-100 text-orange-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (statsLoading && activeTab === "dashboard") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <TrendingUp className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="flights">
              <Plane className="h-4 w-4 mr-1" />
              {t("admin.flights")}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Ticket className="h-4 w-4 mr-1" />
              {t("admin.bookings")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.totalFlights")}
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalFlights || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plane className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.totalBookings")}
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalBookings || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.totalUsers")}
                    </p>
                    <p className="text-3xl font-bold">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.totalRevenue")}
                    </p>
                    <p className="text-3xl font-bold">
                      {((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("admin.revenueChart")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenue && revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={v => formatDate(v)} />
                    <YAxis tickFormatter={v => formatCurrency(v)} />
                    <Tooltip
                      formatter={(value: any) => [
                        Number(value).toLocaleString("vi-VN") + " VND",
                        "Doanh thu",
                      ]}
                      labelFormatter={label => formatDate(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No revenue data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings & Flights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.recentBookings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings?.slice(0, 5).map(booking => (
                    <div
                      key={booking.bookingID}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sm">
                            {booking.bookingID}
                          </span>
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(booking.bookDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {Number(booking.totalAmount).toLocaleString("vi-VN")}{" "}
                          VND
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center py-8">
                      No bookings yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Flights */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Flights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {flights?.slice(0, 5).map(flight => (
                    <div
                      key={flight.flightID}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{flight.flightID}</span>
                          <Badge className={getStatusBadge(flight.status)}>
                            {flight.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {flight.routeID}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatTime(flight.scheduledDeparture)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(flight.scheduledDeparture)}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center py-8">
                      No flights yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Flights Tab */}
      {activeTab === "flights" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Quản lý chuyến bay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : flights && flights.length > 0 ? (
              <div className="space-y-3">
                {flights.map(flight => (
                  <div
                    key={flight.flightID}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-lg">
                          {flight.flightID}
                        </span>
                        <Badge className={getStatusBadge(flight.status)}>
                          {flight.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Route: {flight.routeID}</span>
                        <span>Aircraft: {flight.aircraftID}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDateTime(flight.scheduledDeparture)}
                      </p>
                      <p className="text-sm text-gray-500">
                        &rarr; {formatDateTime(flight.scheduledArrival)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Plane className="h-12 w-12 mx-auto mb-4" />
                <p>No flights found</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlightPage(p => Math.max(1, p - 1))}
                disabled={flightPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">Page {flightPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlightPage(p => p + 1)}
                disabled={!flights || flights.length < 10}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Quản lý đặt vé
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <div
                    key={booking.bookingID}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-medium">
                          {booking.bookingID}
                        </span>
                        <Badge className={getStatusBadge(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>Customer: {booking.customerID}</span>
                        <span className="mx-2">|</span>
                        <span>{formatDateTime(booking.bookDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">
                        {Number(booking.totalAmount).toLocaleString("vi-VN")}{" "}
                        VND
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Ticket className="h-12 w-12 mx-auto mb-4" />
                <p>No bookings found</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                disabled={bookingPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">Page {bookingPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookingPage(p => p + 1)}
                disabled={!bookings || bookings.length < 10}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
