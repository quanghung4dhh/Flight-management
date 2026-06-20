import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function Booking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { flightId } = useParams<{ flightId: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const seatClass = (searchParams.get("class") || "ECO") as
    | "ECO"
    | "BUS"
    | "FST";
  const passengers = Number(searchParams.get("passengers") || "1");

  const { data: flight, isLoading: flightLoading } = trpc.flight.byId.useQuery(
    { id: flightId || "" },
    { enabled: !!flightId }
  );

  const { data: seatList, isLoading: seatsLoading } =
    trpc.flight.seats.useQuery(
      { flightId: flightId || "" },
      { enabled: !!flightId }
    );

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: data => {
      setBookingId(data.bookingID);
      setStep("payment");
    },
  });

  const createPayment = trpc.payment.create.useMutation({
    onSuccess: data => {
      setPaymentId(data.paymentId);
    },
  });

  const confirmPayment = trpc.payment.confirm.useMutation({
    onSuccess: () => {
      setStep("success");
    },
  });

  const [step, setStep] = useState<"info" | "seats" | "payment" | "success">(
    "info"
  );
  const [passengerDetails, setPassengerDetails] = useState(
    Array.from({ length: passengers }, () => ({
      name: "",
      passport: "",
    }))
  );
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  if (flightLoading || seatsLoading || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-500">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const totalAmount = Number(flight.basePrice || "0") * passengers;

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handlePassengerChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...passengerDetails];
    updated[index] = { ...updated[index], [field]: value };
    setPassengerDetails(updated);
  };

  const handleSubmitInfo = () => {
    if (passengerDetails.some(p => !p.name)) return;
    setStep("seats");
  };

  const handleSubmitSeats = () => {
    if (!flightId) return;
    createBooking.mutate({
      flightId: flightId,
      seatIds: selectedSeats,
      passengerDetails,
      totalAmount,
    });
  };

  const handlePayment = () => {
    console.log(
      "handlePayment called, bookingId:",
      bookingId,
      "paymentMethod:",
      paymentMethod
    );
    if (!bookingId || !paymentMethod) return;
    createPayment.mutate({
      bookingId,
      amount: totalAmount,
      method: paymentMethod as "credit_card" | "bank_transfer" | "momo",
    });
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;
    setProcessingPayment(true);
    confirmPayment.mutate({ paymentId });
  };

  // Filter seats by selected class
  const classMap: Record<string, string> = {
    ECO: "Economy",
    BUS: "Business",
    FST: "First Class",
  };
  const filteredSeats =
    seatList?.filter(s =>
      s.seatClassName.toLowerCase().includes(classMap[seatClass].toLowerCase())
    ) || [];

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đặt vé</p>
            <Button onClick={() => navigate("/login")}>
              {t("common.login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center justify-center mb-8">
        {["info", "seats", "payment"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s || (step === "success" && i < 3)
                  ? "bg-blue-600 text-white"
                  : step === "payment" && i < 2
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-16 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Flight Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">
                {formatTime(flight.scheduledDeparture)}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(flight.scheduledDeparture)}
              </p>
            </div>
            <div className="flex flex-col items-center px-4">
              <p className="text-xs text-gray-500">{flight.flightID}</p>
              <div className="flex items-center my-1">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <div className="w-16 h-0.5 bg-blue-600 mx-1" />
                <Plane className="h-4 w-4 text-blue-600" />
                <div className="w-16 h-0.5 bg-blue-600 mx-1" />
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatTime(flight.scheduledArrival)}</p>
              <p className="text-xs text-gray-400">
                {formatDate(flight.scheduledArrival)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Passenger Info */}
      {step === "info" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("booking.passengerInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {passengerDetails.map((p, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">
                  {t("common.adult")} {i + 1}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("common.name")}</Label>
                    <Input
                      value={p.name}
                      onChange={e =>
                        handlePassengerChange(i, "name", e.target.value)
                      }
                      placeholder="Nguyen Van A"
                    />
                  </div>
                  <div>
                    <Label>{t("common.passport")}</Label>
                    <Input
                      value={p.passport}
                      onChange={e =>
                        handlePassengerChange(i, "passport", e.target.value)
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">
                  {passengers} x{" "}
                  {t(
                    `common.${seatClass === "ECO" ? "economy" : seatClass === "BUS" ? "business" : "premium"}`
                  )}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <Button
                onClick={handleSubmitInfo}
                disabled={passengerDetails.some(p => !p.name)}
              >
                {t("common.next")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Seat Selection */}
      {step === "seats" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("booking.seatSelection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Đã chọn {selectedSeats.length}/{passengers} ghế
            </p>

            {filteredSeats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Không có ghế trống cho hạng vé này
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-2 mb-6">
                {filteredSeats.map(seat => {
                  const isSelected = selectedSeats.includes(seat.seatID);
                  const isBooked = !seat.isAvailable;
                  return (
                    <button
                      key={seat.seatID}
                      className={`p-2 rounded text-xs font-medium transition-colors ${
                        isBooked
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : isSelected
                            ? "bg-blue-600 text-white"
                            : "border hover:bg-blue-50 hover:border-blue-300"
                      }`}
                      disabled={isBooked}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSeats(
                            selectedSeats.filter(id => id !== seat.seatID)
                          );
                        } else if (selectedSeats.length < passengers) {
                          setSelectedSeats([...selectedSeats, seat.seatID]);
                        }
                      }}
                    >
                      <div>{seat.seatNumber}</div>
                      <div className="text-[10px] opacity-70">
                        {seat.seatClassName}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("info")}>
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleSubmitSeats}
                  disabled={selectedSeats.length !== passengers}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("booking.payment")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  id: "credit_card",
                  icon: CreditCard,
                  label: t("booking.creditCard"),
                },
                {
                  id: "bank_transfer",
                  icon: Wallet,
                  label: t("booking.bankTransfer"),
                },
                { id: "momo", icon: QrCode, label: "Momo" },
              ].map(method => (
                <button
                  key={method.id}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === method.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    handlePayment();
                  }}
                >
                  <method.icon className="h-8 w-8" />
                  <span className="text-sm">{method.label}</span>
                </button>
              ))}
            </div>

            {paymentId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">
                  {t("booking.processing")}
                </p>
                <p className="text-sm text-green-600">
                  Transaction ID: {paymentId}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">{t("common.total")}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAmount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("seats")}>
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={!paymentId || processingPayment}
                >
                  {processingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("common.confirm")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === "success" && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {t("booking.bookingConfirmed")}
            </h2>
            <p className="text-gray-600 mb-2">{t("booking.bookingCode")}:</p>
            <p className="text-3xl font-bold text-blue-600 mb-6">{bookingId}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/my-bookings")}>
                {t("common.myBookings")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                {t("common.home")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
