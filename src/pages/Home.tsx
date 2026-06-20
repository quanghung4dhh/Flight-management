import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Search,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  Shield,
  Clock,
  Headphones,
  Database,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [passengers, setPassengers] = useState("1");
  const [seatClass, setSeatClass] = useState("ECO");

  const { data: airports, isLoading: airportsLoading } =
    trpc.airport.list.useQuery();
  const seedData = trpc.seed.run.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const showSeedButton =
    !airportsLoading && (!airports || airports.length === 0);

  const handleSearch = () => {
    if (!fromAirport || !toAirport || !departureDate) return;
    const params = new URLSearchParams({
      from: fromAirport,
      to: toAirport,
      date: departureDate,
      passengers,
      class: seatClass,
      tripType,
    });
    navigate(`/search?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Hero Section */}
      <div
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: "url(/hero-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/70" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto">
              {t("home.heroSubtitle")}
            </p>
            {showSeedButton && (
              <div className="mt-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => seedData.mutate()}
                  disabled={seedData.isPending}
                >
                  <Database className="h-5 w-5 mr-2" />
                  {seedData.isPending ? "Seeding..." : "Initialize Demo Data"}
                </Button>
                <p className="text-sm text-blue-200 mt-2">
                  Click to load sample airports, flights, and aircraft
                </p>
              </div>
            )}
          </div>

          {/* Search Form */}
          <Card className="max-w-4xl mx-auto shadow-2xl">
            <CardContent className="p-6">
              <Tabs value={tripType} onValueChange={v => setTripType(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="one_way">{t("home.oneWay")}</TabsTrigger>
                  <TabsTrigger value="round_trip">
                    {t("home.roundTrip")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    {t("common.from")}
                  </Label>
                  <Select value={fromAirport} onValueChange={setFromAirport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sân bay" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports?.map(ap => (
                        <SelectItem key={ap.airportID} value={ap.airportID}>
                          {ap.iataCode} - {ap.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-gray-700">
                    <MapPin className="h-4 w-4" />
                    {t("common.to")}
                  </Label>
                  <Select value={toAirport} onValueChange={setToAirport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sân bay" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports?.map(ap => (
                        <SelectItem key={ap.airportID} value={ap.airportID}>
                          {ap.iataCode} - {ap.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    {t("common.date")}
                  </Label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    min={today}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-gray-700">
                    <Users className="h-4 w-4" />
                    {t("common.passengers")}
                  </Label>
                  <Select value={passengers} onValueChange={setPassengers}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {t("common.passengers").toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-48">
                  <Label className="text-gray-700">{t("common.class")}</Label>
                  <Select value={seatClass} onValueChange={setSeatClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECO">{t("common.economy")}</SelectItem>
                      <SelectItem value="BUS">{t("common.business")}</SelectItem>
                      <SelectItem value="FST">{t("common.firstClass")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="lg"
                  className="w-full sm:w-auto sm:ml-auto bg-blue-600 hover:bg-blue-700"
                  onClick={handleSearch}
                  disabled={!fromAirport || !toAirport || !departureDate}
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t("common.search")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popular Routes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("home.popularRoutes")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              from: "SGN",
              to: "HAN",
              fromCity: "Ho Chi Minh City",
              toCity: "Hanoi",
              price: "1,590,000",
            },
            {
              from: "SGN",
              to: "DAD",
              fromCity: "Ho Chi Minh City",
              toCity: "Da Nang",
              price: "908,000",
            },
            {
              from: "HAN",
              to: "DAD",
              fromCity: "Hanoi",
              toCity: "Da Nang",
              price: "940,000",
            },
            {
              from: "SGN",
              to: "CXR",
              fromCity: "Ho Chi Minh City",
              toCity: "Nha Trang",
              price: "467,000",
            },
            {
              from: "SGN",
              to: "PQC",
              fromCity: "Ho Chi Minh City",
              toCity: "Phu Quoc",
              price: "452,000",
            },
            {
              from: "SGN",
              to: "SIN",
              fromCity: "Ho Chi Minh City",
              toCity: "Singapore",
              price: "2,340,000",
            },
          ].map((route, i) => (
            <Card
              key={i}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                const apFrom = airports?.find(a => a.iataCode === route.from);
                const apTo = airports?.find(a => a.iataCode === route.to);
                if (apFrom && apTo) {
                  setFromAirport(apFrom.airportID);
                  setToAirport(apTo.airportID);
                  setDepartureDate(today);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{route.fromCity}</p>
                    <p className="text-sm text-gray-500">{route.from}</p>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <ArrowRight className="h-5 w-5" />
                    <Plane className="h-4 w-4 ml-1" />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{route.toCity}</p>
                    <p className="text-sm text-gray-500">{route.to}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-right">
                  <span className="text-blue-600 font-bold">
                    {route.price} VND
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    / {t("common.adult").toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">
            {t("home.whyChooseUs")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">{t("home.feature1")}</h3>
              <p className="text-gray-600 text-sm">
                Cam kết giá vé tốt nhất với nhiều ưu đãi hấp dẫn
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">{t("home.feature2")}</h3>
              <p className="text-gray-600 text-sm">
                Đặt vé nhanh chóng chỉ trong vài phút
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">{t("home.feature3")}</h3>
              <p className="text-gray-600 text-sm">
                Đội ngũ hỗ trợ tận tình 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}