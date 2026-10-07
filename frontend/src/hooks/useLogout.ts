// Shared logout — DashboardLayout aur ProfileHub dono isi ko use karte hain.
//
// Alag-alag jagah logout likhne se yahi hota hai jo ProfileHub me hua tha:
// ek button par handler hi nahi laga, aur push token backend me pada reh gaya.
// Isliye pura logout ek hi jagah rakha hai.
//
// Order important hai: push token pehle hatao, phir logout. DELETE request ko
// valid access token chahiye — logout ke baad call karne par 401 aata hai.

import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import authService from "@/auth/authServices";
import { disablePushNotifications } from "@/lib/pushNotifications";

/**
 * Browser me pada session data clear karta hai.
 *
 * NOTE: "accessToken" wahi key hai jo axiosInstance aur authSlice use karte
 * hain — asli session isi se chalta hai. "token" legacy key hai jo kahin set
 * nahi hoti, par purane browsers me padi ho sakti hai, isliye saath me hata
 * dete hain.
 */
function clearLocalSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

export function useLogout() {
  const navigate = useNavigate();

  // Double-click par do logout calls na jayein.
  const busyRef = useRef(false);

  const logout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      // Ye function kabhi throw nahi karta, isliye logout block nahi hoga.
      await disablePushNotifications();

      await authService.logout();

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });

      clearLocalSession();
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      busyRef.current = false;
    }
  }, [navigate]);

  return logout;
}

export default useLogout;
