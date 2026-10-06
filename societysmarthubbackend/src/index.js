import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startStaffOverstayCron } from "./services/staffOverstayService.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

try {
  await connectDB();
  startStaffOverstayCron();

  const server = http.createServer(app);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} catch (err) {
  console.error("DB connect failed", err);
  process.exit(1);
}
