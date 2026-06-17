import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Users, ArrowRight, Filter, Calendar } from "lucide-react";

export default function SearchResults() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const from = Number(searchParams.get("from"));
  const to = Number(searchParams.get("to"));
  const date = searchParams.get("date") || "";
  const passengers = Number(searchParams.get("passengers") || "1");
  const seatClass = (searchParams.get("class") || "economy") as
    | "economy"
    | "premium"
    | "business";

  const [sortBy, setSortBy] = useState<"price" | "time">("price");

  const { data, isLoading } = trpc.flight.search.useQuery(
    {
      departureAirportId: from,
      arrivalAirportId: to,
      departureDate: date,
      seatClass,
      passengers,
    },
    { enabled: !!from && !!to && !!date }
  );

  const { data: airports } = trpc.airport.list.useQuery();

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString("vi-VN");
  };

  const sortedFlights = data?.flights
    ? [...data.flights].sort((a, b) => {
        if (sortBy === "price") return Number(a.price) - Number(b.price);
        return (
          new Date(a.scheduledDeparture).getTime() -
          new Date(b.scheduledDeparture).getTime()
        );
      })
    : [];

  const departureAirport = airports?.find(a => a.id === from);
  const arrivalAirport = airports?.find(a => a.id === to);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t("search.title")}</h1>
        <div className="flex items-center text-gray-600 text-sm">
          <span className="font-medium">{departureAirport?.city}</span>
          <ArrowRight className="h-4 w-4 mx-2" />
          <span className="font-medium">{arrivalAirport?.city}</span>
          <span className="mx-2">|</span>
          <Calendar className="h-4 w-4 mr-1" />
          {new Date(date).toLocaleDateString("vi-VN")}
          <span className="mx-2">|</span>
          <Users className="h-4 w-4 mr-1" />
          {passengers} {t("common.passengers").toLowerCase()}
          <span className="mx-2">|</span>
          <Plane className="h-4 w-4 mr-1" />
          {t(`common.${seatClass}`)}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {sortedFlights.length} {t("common.flights").toLowerCase()}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "price" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("price")}
          >
            {t("search.priceLowHigh")}
          </Button>
          <Button
            variant={sortBy === "time" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("time")}
          >
            {t("search.earliest")}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {sortedFlights.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t("common.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          sortedFlights.map(flight => (
            <Card
              key={flight.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() =>
                navigate(
                  `/booking/${flight.id}?class=${seatClass}&passengers=${passengers}`
                )
              }
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Flight Info */}
                  <div className="flex-1 flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatTime(flight.scheduledDeparture)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {departureAirport?.code}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-4">
                      <p className="text-xs text-gray-500 mb-1">
                        {formatDuration(
                          data?.route?.estimatedDurationMinutes || 0
                        )}
                      </p>
                      <div className="w-full flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="flex-1 h-0.5 bg-blue-600 mx-2" />
                        <Plane className="h-4 w-4 text-blue-600 rotate-90" />
                        <div className="flex-1 h-0.5 bg-blue-600 mx-2" />
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {flight.flightNumber}
                      </Badge>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatTime(flight.scheduledArrival)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {arrivalAirport?.code}
                      </p>
                    </div>
                  </div>

                  {/* Aircraft & Seats */}
                  <div className="text-sm text-gray-600 lg:text-right">
                    <p>{flight.aircraft?.model}</p>
                    <p className="text-green-600 font-medium">
                      {flight.availableSeats} {t("search.availableSeats")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right lg:pl-6 lg:border-l">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(flight.price)} VND
                    </p>
                    <p className="text-sm text-gray-500">
                      / {t("common.adult").toLowerCase()}
                    </p>
                    <Button className="mt-2" size="sm">
                      {t("search.select")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
