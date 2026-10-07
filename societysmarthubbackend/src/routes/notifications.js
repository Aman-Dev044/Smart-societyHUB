import express from "express";
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount,
  broadcastManual,
  getNotificationStats,
  registerFcmToken,
  unregisterFcmToken,
  pushStatus
} from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

const router = express.Router();

// All notification routes are protected
router.use(auth);

// Stats route at the top to avoid any conflict
router.get("/stats-overview", getNotificationStats);

// Member/Any user routes
router.get("/my", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);

// [FCM] Device token register / unregister — har role ke liye, kyunki push
// resident, guard aur admin sabko chahiye.
// Frontend: login ke baad register, logout se pehle unregister.
router.post("/fcm-token", registerFcmToken);
router.delete("/fcm-token", unregisterFcmToken);

// [FCM] Push setup live hai ya nahi — deploy ke baad verify karne ke liye.
router.get("/push-status", permit("society_admin", "superadmin", "admin", "super-admin"), pushStatus);

// Param route sabse last me, taaki upar ke fixed paths isse shadow na hon.
router.patch("/:id/read", markAsRead);

// Society Admin, Super Admin, Guard, Member - Manual Broadcast
router.post("/broadcast", permit("society_admin", "superadmin", "guard", "user", "admin", "super-admin", "member"), broadcastManual);

export default router;
