import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startStaffOverstayCron } from "./services/staffOverstayService.js";
import { isPushEnabled } from "./config/firebase.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

try {
  await connectDB();

  // Firebase ko boot par hi init kar lete hain, taaki credentials ka masla
  // server start hote waqt log me dikhe — pehla push fail hone par nahi.
  // Credentials na hon to ye false return karta hai, server fir bhi chalta hai.
  isPushEnabled();

  startStaffOverstayCron();

  const server = http.createServer(app);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} catch (err) {
  console.error("DB connect failed", err);
  process.exit(1);
}
