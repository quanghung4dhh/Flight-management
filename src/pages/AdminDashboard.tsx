import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const navigate = useNavigate();
  // time range can be added later

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: revenue } = trpc.admin.revenueReport.useQuery({});
  const { data: flights } = trpc.admin.flightList.useQuery({
    page: 1,
    limit: 10,
  });
  const { data: bookings } = trpc.admin.bookingList.useQuery({
    page: 1,
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      boarding: "bg-yellow-100 text-yellow-800",
      departed: "bg-green-100 text-green-800",
      delayed: "bg-orange-100 text-orange-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (statsLoading) {
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/flights")}
          >
            <Plane className="h-4 w-4 mr-1" />
            {t("admin.flights")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/bookings")}
          >
            <Ticket className="h-4 w-4 mr-1" />
            {t("admin.bookings")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {t("admin.totalFlights")}
                </p>
                <p className="text-3xl font-bold">{stats?.totalFlights || 0}</p>
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
                <p className="text-sm text-gray-500">{t("admin.totalUsers")}</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
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
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">
                        {booking.bookingCode}
                      </span>
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {booking.flight?.route?.departureAirport?.code} →{" "}
                      {booking.flight?.route?.arrivalAirport?.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {Number(booking.totalAmount).toLocaleString("vi-VN")} VND
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.user?.name}
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
                  key={flight.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{flight.flightNumber}</span>
                      <Badge className={getStatusBadge(flight.status)}>
                        {flight.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {flight.route?.departureAirport?.code} →{" "}
                      {flight.route?.arrivalAirport?.code}
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
                <p className="text-gray-400 text-center py-8">No flights yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
