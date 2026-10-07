// Push notifications ko app me wire karne wala hook.
//
// DashboardLayout me mount hota hai — wahi ek jagah hai jo har logged-in page
// ko wrap karti hai (resident, guard, society admin, super admin). Isse:
//   - login ke baad token automatically register ho jata hai
//   - jo user pehle se logged-in hai (page reload) uska bhi token refresh hota hai
//   - foreground me aane wale push toast ban jate hain
//
// Push fail hone par app par koi asar nahi padta — reason sirf console me
// jata hai, user ko error nahi dikhate.

import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/store";
import { fetchUnreadCount } from "@/features/notificationSlice";
import {
  enablePushNotifications,
  listenForForegroundMessages,
} from "@/lib/pushNotifications";
import { isFirebaseConfigured } from "@/lib/firebase";

export function usePushNotifications() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"idle" | "active" | "unavailable">("idle");

  // StrictMode dev me effect do baar chalta hai — permission prompt aur token
  // call ek hi baar honi chahiye.
  const triedRef = useRef(false);

  useEffect(() => {
    // Logged out user ke liye token register karne ka matlab nahi —
    // backend request 401 se wapas aayegi.
    const token = localStorage.getItem("accessToken");
    if (!token || !isFirebaseConfigured() || triedRef.current) return;

    triedRef.current = true;

    void enablePushNotifications().then((result) => {
      if (result.ok) {
        setStatus("active");
        return;
      }
      setStatus("unavailable");
      console.info(`[push] enable nahi hua — ${result.reason}`);
    });
  }, []);

  useEffect(() => {
    // Tab khuli ho tab browser notification nahi dikhti, isliye in-app toast.
    const unsubscribe = listenForForegroundMessages((payload) => {
      const data = payload.data || {};

      toast({
        title: data.title || "New notification",
        description: data.body,
        // Gate par khada visitor / security alert — destructive variant se
        // ye baaki toasts se alag dikhta hai.
        variant:
          data.category === "visitor" || data.category === "alert"
            ? "destructive"
            : "default",
      });

      // Sidebar ka bell badge turant update ho jaye.
      void dispatch(fetchUnreadCount());
    });

    return unsubscribe;
  }, [dispatch]);

  return { status };
}

export default usePushNotifications;
