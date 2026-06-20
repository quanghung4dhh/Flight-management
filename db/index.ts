import { drizzle } from "drizzle-orm/mysql2";
import "dotenv/config";
import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "FlightManagement",
  port: parseInt(process.env.DB_PORT || "3306"),
});

export const db = drizzle(connection, { mode: "default" });
