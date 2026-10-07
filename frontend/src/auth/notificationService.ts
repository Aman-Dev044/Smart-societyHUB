import axiosInstance from "./axiosInstance";
import { AUTHROUTES } from "./authRoutes";

const getMyNotifications = async (page: number = 1, limit: number = 10, category?: string) => {
  let url = `${AUTHROUTES.NOTIFICATION_GET_MY}?page=${page}&limit=${limit}`;
  if (category && category !== 'All') {
    url += `&category=${encodeURIComponent(category)}`;
  }
  const response = await axiosInstance.get(url);
  return response.data;
};

const getUnreadCount = async () => {
  const response = await axiosInstance.get(AUTHROUTES.NOTIFICATION_UNREAD_COUNT);
  return response.data;
};

const getStats = async () => {
  const response = await axiosInstance.get(AUTHROUTES.NOTIFICATION_STATS);
  return response.data;
};

const markAsRead = async (id: string) => {
  const response = await axiosInstance.patch(`${AUTHROUTES.NOTIFICATION_MARK_READ}/${id}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await axiosInstance.patch(AUTHROUTES.NOTIFICATION_MARK_ALL_READ);
  return response.data;
};

const broadcastManual = async (data: { title: string; message: string; category: string; targetAudience: string }) => {
  const response = await axiosInstance.post(AUTHROUTES.NOTIFICATION_BROADCAST, data);
  return response.data;
};

const getSocietyResidents = async (societyId: string) => {
  const response = await axiosInstance.get(`${AUTHROUTES.ADMIN_GET_RESIDENTS}?societyId=${societyId}`);
  return response.data;
};

// --- FCM push ---

// Login ke baad device token backend ko bhejo. Backend $addToSet use karta
// hai, isliye dobara bhejna safe hai.
const registerFcmToken = async (token: string) => {
  const response = await axiosInstance.post(AUTHROUTES.NOTIFICATION_FCM_TOKEN, { token });
  return response.data;
};

// Logout par token hatao, warna logged-out device par push aate rahenge.
const unregisterFcmToken = async (token: string) => {
  const response = await axiosInstance.delete(AUTHROUTES.NOTIFICATION_FCM_TOKEN, {
    data: { token },
  });
  return response.data;
};

const notificationService = {
  getMyNotifications,
  getUnreadCount,
  getStats,
  markAsRead,
  markAllAsRead,
  broadcastManual,
  getSocietyResidents,
  registerFcmToken,
  unregisterFcmToken,
};

export default notificationService;
