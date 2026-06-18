CREATE TABLE `Accounts` (
  `AccountID` varchar(255) PRIMARY KEY,
  `Username` varchar(255),
  `Password` varchar(255),
  `Role` varchar(255),
  `Status` varchar(255),
  `CreatedAt` timestamp,
  `UpdatedAt` timestamp
);

CREATE TABLE `Customers` (
  `CustomerID` varchar(255) PRIMARY KEY,
  `AccountID` varchar(255),
  `Name` varchar(255),
  `Email` varchar(255),
  `Phone` varchar(255),
  `Passport` varchar(255),
  `Address` varchar(255),
  `Birthday` timestamp
);

CREATE TABLE `Notification` (
  `NotificationID` varchar(255) PRIMARY KEY,
  `AccountID` varchar(255),
  `Type` varchar(255),
  `Message` varchar(255),
  `SentAt` timestamp,
  `Status` varchar(255)
);

CREATE TABLE `Airport` (
  `AirportID` varchar(255) PRIMARY KEY,
  `IATACode` varchar(255) COMMENT 'Mã sân bay chuẩn quốc tế, VD: HAN, SGN',
  `City` varchar(255),
  `Country` varchar(255)
);

CREATE TABLE `Route` (
  `RouteID` varchar(255) PRIMARY KEY,
  `DepartureAirportID` varchar(255),
  `ArrivalAirportID` varchar(255),
  `Distance` integer,
  `Duration` integer
);

CREATE TABLE `Aircraft` (
  `AircraftID` varchar(255) PRIMARY KEY,
  `Model` varchar(255),
  `Manufacturer` varchar(255),
  `Capacity` integer,
  `Status` varchar(255)
);

CREATE TABLE `Maintenance` (
  `MaintenanceID` varchar(255) PRIMARY KEY,
  `AircraftID` varchar(255),
  `Description` varchar(255),
  `StartDate` timestamp,
  `StopDate` timestamp,
  `Status` varchar(255)
);

CREATE TABLE `Crew` (
  `CrewID` varchar(255) PRIMARY KEY,
  `Name` varchar(255),
  `Role` varchar(255),
  `LicenseNumber` varchar(255),
  `Status` varchar(255)
);

CREATE TABLE `FlightCrew` (
  `FlightCrewID` varchar(255) PRIMARY KEY,
  `FlightID` varchar(255),
  `CrewID` varchar(255),
  `AssignmentRole` varchar(255)
);

CREATE TABLE `Flight` (
  `FlightID` varchar(255) PRIMARY KEY,
  `RouteID` varchar(255),
  `AircraftID` varchar(255),
  `ScheduledDeparture` timestamp,
  `ScheduledArrival` timestamp,
  `ActualDeparture` timestamp,
  `ActualArrival` timestamp,
  `Status` varchar(255),
  `CreatedAt` timestamp,
  `UpdatedAt` timestamp
);

CREATE TABLE `SeatClass` (
  `SeatClassID` varchar(255) PRIMARY KEY,
  `Name` varchar(255)
);

CREATE TABLE `Seat` (
  `SeatID` varchar(255) PRIMARY KEY,
  `AircraftID` varchar(255),
  `SeatClassID` varchar(255),
  `SeatNumber` varchar(255)
);

CREATE TABLE `FlightPricing` (
  `PricingID` varchar(255) PRIMARY KEY,
  `FlightID` varchar(255),
  `SeatClassID` varchar(255),
  `BasePrice` decimal
);

CREATE TABLE `Booking` (
  `BookingID` varchar(255) PRIMARY KEY,
  `CustomerID` varchar(255),
  `BookDate` timestamp,
  `TotalAmount` decimal,
  `Status` varchar(255),
  `CreatedAt` timestamp,
  `UpdatedAt` timestamp
);

CREATE TABLE `Ticket` (
  `TicketID` varchar(255) PRIMARY KEY,
  `BookingID` varchar(255),
  `FlightID` varchar(255),
  `SeatID` varchar(255),
  `Status` varchar(255),
  `PassengerName` varchar(255),
  `PassengerPassport` varchar(255),
  `PassengerDOB` timestamp,
  `PurchasedPrice` decimal COMMENT 'Giá vé được chốt tại thời điểm thanh toán'
);

CREATE TABLE `Payment` (
  `PaymentID` varchar(255) PRIMARY KEY,
  `TransactionID` varchar(255),
  `BookingID` varchar(255),
  `PayDate` timestamp,
  `Status` varchar(255),
  `Method` varchar(255),
  `CreatedAt` timestamp,
  `UpdatedAt` timestamp
);

CREATE TABLE `Baggage` (
  `BaggageID` varchar(255) PRIMARY KEY,
  `TicketID` varchar(255),
  `Weight` integer COMMENT 'Số kg hành lý mua thêm, VD: 15kg, 20kg',
  `Price` decimal
);

ALTER TABLE `Customers` ADD FOREIGN KEY (`AccountID`) REFERENCES `Accounts` (`AccountID`);

ALTER TABLE `Notification` ADD FOREIGN KEY (`AccountID`) REFERENCES `Accounts` (`AccountID`);

ALTER TABLE `Route` ADD FOREIGN KEY (`DepartureAirportID`) REFERENCES `Airport` (`AirportID`);

ALTER TABLE `Route` ADD FOREIGN KEY (`ArrivalAirportID`) REFERENCES `Airport` (`AirportID`);

ALTER TABLE `Flight` ADD FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`);

ALTER TABLE `Flight` ADD FOREIGN KEY (`AircraftID`) REFERENCES `Aircraft` (`AircraftID`);

ALTER TABLE `Maintenance` ADD FOREIGN KEY (`AircraftID`) REFERENCES `Aircraft` (`AircraftID`);

ALTER TABLE `FlightCrew` ADD FOREIGN KEY (`FlightID`) REFERENCES `Flight` (`FlightID`);

ALTER TABLE `FlightCrew` ADD FOREIGN KEY (`CrewID`) REFERENCES `Crew` (`CrewID`);

ALTER TABLE `Seat` ADD FOREIGN KEY (`AircraftID`) REFERENCES `Aircraft` (`AircraftID`);

ALTER TABLE `Seat` ADD FOREIGN KEY (`SeatClassID`) REFERENCES `SeatClass` (`SeatClassID`);

ALTER TABLE `FlightPricing` ADD FOREIGN KEY (`FlightID`) REFERENCES `Flight` (`FlightID`);

ALTER TABLE `FlightPricing` ADD FOREIGN KEY (`SeatClassID`) REFERENCES `SeatClass` (`SeatClassID`);

ALTER TABLE `Booking` ADD FOREIGN KEY (`CustomerID`) REFERENCES `Customers` (`CustomerID`);

ALTER TABLE `Ticket` ADD FOREIGN KEY (`BookingID`) REFERENCES `Booking` (`BookingID`);

ALTER TABLE `Ticket` ADD FOREIGN KEY (`FlightID`) REFERENCES `Flight` (`FlightID`);

ALTER TABLE `Ticket` ADD FOREIGN KEY (`SeatID`) REFERENCES `Seat` (`SeatID`);

ALTER TABLE `Payment` ADD FOREIGN KEY (`BookingID`) REFERENCES `Booking` (`BookingID`);

ALTER TABLE `Baggage` ADD FOREIGN KEY (`TicketID`) REFERENCES `Ticket` (`TicketID`);
