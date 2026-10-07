import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createResidentAdminService,
  getMySocietyAdminService,
  getResidentsAdminService,
  getResidentDetailsAdminService,
  updateResidentAdminService,
  toggleResidentStatusAdminService,
  getAdminProfileService,
  updateAdminProfileService,
  changeMyPasswordService,
  getComplaintsAdminService,
  getComplaintStatsAdminService,
  updateComplaintStatusAdminService,
  getNoticesAdminService,
  createNoticeAdminService,
  pinNoticeAdminService,
  deleteNoticeAdminService,
  updateNoticeAdminService,
  createChargeAdminService,
  getChargesAdminService,
  getChargeDetailsAdminService,
  updateChargeAdminService,
  deleteChargeAdminService,
  getPaymentsAdminService,
  reviewPaymentAdminService,
  addVehicleAdminService,
  deleteVehicleAdminService,
  getDeactivationRequestsAdminService,
  reviewDeactivationRequestAdminService,
  rejectDeactivationRequestAdminService,
  getUserActivityAdminService,
  getStaffLogsService,
  markStaffEntryService,
  markStaffExitService,
  blockStaffService,
  unblockStaffService,
  createStaffService,
  getStaffAttendanceHistoryService,
  verifyStaffService, // [MODULE-C]: New service import
  searchStaffService,
  getBlockedStaffService,
  oneTimeStaffEntryService,
  getOneTimeStaffListService,
  createDeliveryService,
  markDeliveryExitService,
  getDeliveryLogsService,
  createVisitorService,
  gateEntryService,
  approveVisitorService,
  rejectVisitorService,
  markVisitorExitService,
  getVisitorHistoryService,
  uploadDocumentService,
  getAdminDocumentsService,
  updateDocumentService,
  deleteDocumentService,
  createSupportTicketService,
  getMySupportTicketsService,
  getSupportTicketDetailsService,
  addSupportTicketMessageService
  } from "../../auth/authServices";

  // ... existing code

  // ─── Support Thunks ─────────────────────────────────────────────────────────────

  export const fetchMySupportTickets = createAsyncThunk(
  "admin/fetchMySupportTickets",
  async (_, { rejectWithValue }) => {
    try {
      return await getMySupportTicketsService();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
  );

  export const fetchSupportTicketDetails = createAsyncThunk(
  "admin/fetchSupportTicketDetails",
  async (id: string, { rejectWithValue }) => {
    try {
      return await getSupportTicketDetailsService(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch details");
    }
  }
  );

  export const createSupportTicket = createAsyncThunk(
  "admin/createSupportTicket",
  async (payload: any, { rejectWithValue }) => {
    try {
      return await createSupportTicketService(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to raise ticket");
    }
  }
  );

  export const addSupportMessage = createAsyncThunk(
  "admin/addSupportMessage",
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await addSupportTicketMessageService(id, payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to send message");
    }
  }
  );


  // [MODULE-C]: VERIFY STAFF THUNK
  export const verifyStaff = createAsyncThunk(
  "admin/verifyStaff",
  async (args: { staffId: string; payload?: any }, { rejectWithValue }) => {
    try {
      return await verifyStaffService(args.staffId, args.payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Verification failed");
    }
  }
  );

  // ─── Document Thunks ─────────────────────────────────────────────────────────────

  export const uploadDocument = createAsyncThunk(
  "admin/uploadDocument",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await uploadDocumentService(formData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Upload failed");
    }
  }
  );

  export const getAdminDocuments = createAsyncThunk(
  "admin/getAdminDocuments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAdminDocumentsService();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch documents");
    }
  }
  );

  export const updateDocument = createAsyncThunk(
  "admin/updateDocument",
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      return await updateDocumentService(id, formData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
  );

  export const deleteDocument = createAsyncThunk(
  "admin/deleteDocument",
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteDocumentService(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
  );

  // [ONE-TIME] Guard gate par entry REQUEST banata hai (entry turant nahi lagti -
  // resident ke approve karne par lagti hai).
export const oneTimeStaffEntry = createAsyncThunk(
  "admin/oneTimeStaffEntry",
  async (staffData: any, { rejectWithValue }) => {
    try {
      return await oneTimeStaffEntryService(staffData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "One-time entry failed");
    }
  }
);

  // [ONE-TIME] Guard ka alag tab - sirf One-time (technician) wale
  // Resident side ke thunks (approve/reject aur pending cards) userSlice me hain.
export const getOneTimeStaffList = createAsyncThunk(
  "admin/getOneTimeStaffList",
  async (
    params: { status?: string; inside?: string; flat?: string } | undefined,
    { rejectWithValue },
  ) => {
    try {
      return await getOneTimeStaffListService(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch one-time staff");
    }
  }
);


interface Society {
  _id: string;
  name: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  settings?: {
    maintenanceDueDay?: number;
    currency?: string;
    timezone?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  totalFloors?: number;
  totalUnits?: number;
  totalTowers?: number;
}

interface AdminState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  society: Society | null;
  selectedResident: any | null;
  residents: any[];
  profile: any | null;
  complaints: any[];
  complaintStats: any;
  notices: any[];
  noticesLoading: boolean;
  charges: any[];
  selectedCharge: any | null;
  payments: any[];
  deactivationRequests: any[];
  deactivationLoading: boolean;
  userActivity: any[];
  activityLoading: boolean;
  
  // Daily Staff State
  staffData: any[];
  blockedStaff: any[];
  staffLoading: boolean;
  staffHistory: any[];
  historyLoading: boolean;

  // Delivery State
  deliveryData: any[];
  deliveryLoading: boolean;

  // Visitor State
  visitorData: any[];
  visitorLoading: boolean;
  generatedCode: string | null;

  // Document State
  documents: any[];
  documentsLoading: boolean;
}

const initialState: AdminState = {
  isLoading: false,
  isSuccess: false,
  error: null,
  society: null,
  selectedResident: null,
  residents: [],
  profile: null,
  complaints: [],
  complaintStats: null,
  notices: [],
  noticesLoading: false,
  charges: [],
  selectedCharge: null,
  payments: [],
  deactivationRequests: [],
  deactivationLoading: false,
  userActivity: [],
  activityLoading: false,

  // Daily Staff Initial State
  staffData: [],
  blockedStaff: [],
  staffLoading: false,
  staffHistory: [],
  historyLoading: false,

  // Delivery Initial State
  deliveryData: [],
  deliveryLoading: false,

  // Visitor Initial State
  visitorData: [],
  visitorLoading: false,
  generatedCode: null,

  // Document Initial State
  documents: [],
  documentsLoading: false,
};

// ─── Visitor Thunks ─────────────────────────────────────────────────────────────

export const createVisitor = createAsyncThunk(
  "admin/createVisitor",
  async (visitorData: any, { rejectWithValue }) => {
    try {
      return await createVisitorService(visitorData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Visitor creation failed");
    }
  }
);

export const approveVisitor = createAsyncThunk(
  "admin/approveVisitor",
  async ({ visitorId, codeEnteredByGuard }: { visitorId: string; codeEnteredByGuard: string }, { rejectWithValue }) => {
    try {
      return await approveVisitorService({ visitorId, codeEnteredByGuard });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Approval failed");
    }
  }
);

// [POINT 3] Guard gate par surprise visitor / technician capture karta hai
export const gateEntry = createAsyncThunk(
  "admin/gateEntry",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await gateEntryService(formData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Gate entry failed");
    }
  }
);

export const rejectVisitor = createAsyncThunk(
  "admin/rejectVisitor",
  async (visitorId: string, { rejectWithValue }) => {
    try {
      return await rejectVisitorService({ visitorId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Rejection failed");
    }
  }
);

export const markVisitorExit = createAsyncThunk(
  "admin/markVisitorExit",
  async (visitorId: string, { rejectWithValue }) => {
    try {
      return await markVisitorExitService({ visitorId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Exit marking failed");
    }
  }
);

export const getVisitorHistory = createAsyncThunk(
  "admin/getVisitorHistory",
  async (flatNumber: string, { rejectWithValue }) => {
    try {
      const res = await getVisitorHistoryService(flatNumber);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch visitor history");
    }
  }
);

// ─── Delivery Thunks ─────────────────────────────────────────────────────────────

export const getDeliveryLogs = createAsyncThunk(
  "admin/getDeliveryLogs",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getDeliveryLogsService();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch delivery logs");
    }
  }
);

export const createDelivery = createAsyncThunk(
  "admin/createDelivery",
  async (deliveryData: any, { rejectWithValue }) => {
    try {
      return await createDeliveryService(deliveryData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delivery entry failed");
    }
  }
);

export const markDeliveryExit = createAsyncThunk(
  "admin/markDeliveryExit",
  async (deliveryId: string, { rejectWithValue }) => {
    try {
      return await markDeliveryExitService({ deliveryId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Exit marking failed");
    }
  }
);

// ─── Daily Staff Thunks ─────────────────────────────────────────────────────────────

export const getStaffLogs = createAsyncThunk(
  "admin/getStaffLogs",
  async (type: string | undefined, { rejectWithValue }) => {
    try {
      const res = await getStaffLogsService(type);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch logs");
    }
  }
);

export const getBlockedStaff = createAsyncThunk(
  "admin/getBlockedStaff",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getBlockedStaffService();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch blocked staff");
    }
  }
);

export const createStaff = createAsyncThunk(
  "admin/createStaff",
  async (staffData: any, { rejectWithValue }) => {
    try {
      return await createStaffService(staffData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

export const markStaffEntry = createAsyncThunk(
  "admin/markStaffEntry",
  async (staffId: string, { rejectWithValue }) => {
    try {
      return await markStaffEntryService({ staffId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Entry failed");
    }
  }
);

export const markStaffExit = createAsyncThunk(
  "admin/markStaffExit",
  async (staffId: string, { rejectWithValue }) => {
    try {
      return await markStaffExitService({ staffId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Exit failed");
    }
  }
);

export const blockStaff = createAsyncThunk(
  "admin/blockStaff",
  async ({ staffId, blockedReason }: { staffId: string; blockedReason: string }, { rejectWithValue }) => {
    try {
      return await blockStaffService({ staffId, blockedReason });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Blocking failed");
    }
  }
);

export const unblockStaff = createAsyncThunk(
  "admin/unblockStaff",
  async (staffId: string, { rejectWithValue }) => {
    try {
      return await unblockStaffService({ staffId });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Unblocking failed");
    }
  }
);

export const getStaffHistory = createAsyncThunk(
  "admin/getStaffHistory",
  async (staffId: string, { rejectWithValue }) => {
    try {
      const res = await getStaffAttendanceHistoryService(staffId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch history");
    }
  }
);

export const searchStaff = createAsyncThunk(
  "admin/searchStaff",
  async (query: string, { rejectWithValue }) => {
    try {
      const res = await searchStaffService({ query });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Search failed");
    }
  }
);

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const addNewResident = createAsyncThunk(
  "admin/addNewResident",
  async (residentData: any, { rejectWithValue }) => {
    try {
      return await createResidentAdminService(residentData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Something went wrong");
    }
  }
);

export const getMySociety = createAsyncThunk<Society>(
  "admin/getMySociety",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getMySocietyAdminService();
      return data.society || data.data || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch society");
    }
  }
);

export const getResidents = createAsyncThunk(
  "admin/getResidents",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getResidentsAdminService();
      return {
        users: data.users || [],
        count: data.count || 0
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load residents");
    }
  }
);

export const getResidentById = createAsyncThunk(
  "admin/getResidentById",
  async (residentId: string, { rejectWithValue }) => {
    try {
      const data = await getResidentDetailsAdminService(residentId);
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateResident = createAsyncThunk(
  "admin/updateResident",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await updateResidentAdminService(id, data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

export const toggleResidentStatus = createAsyncThunk(
  "admin/toggleResidentStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await toggleResidentStatusAdminService(id);
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);

export const getAdminProfile = createAsyncThunk(
  "admin/getAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAdminProfileService();
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
    }
  }
);

export const updateAdminProfile = createAsyncThunk(
  "admin/updateAdminProfile",
  async (updatedData: any, { rejectWithValue }) => {
    try {
      const data = await updateAdminProfileService(updatedData);
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update profile");
    }
  }
);

export const changePassword = createAsyncThunk(
  "admin/changePassword",
  async (passwordData: any, { rejectWithValue }) => {
    try {
      return await changeMyPasswordService(passwordData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Password change failed");
    }
  }
);

export const getComplaints = createAsyncThunk(
  "admin/getComplaints",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getComplaintsAdminService();
      return data.complaints || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch complaints");
    }
  }
);

export const getComplaintStats = createAsyncThunk(
  "admin/getComplaintStats",
  async (_, { rejectWithValue }) => {
    try {
      return await getComplaintStatsAdminService();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats");
    }
  }
);

export const updateComplaintStatus = createAsyncThunk(
  "admin/updateComplaintStatus",
  async (
    { id, status, adminRemarks }: { id: string; status: string; adminRemarks?: string },
    { rejectWithValue }
  ) => {
    try {
      return await updateComplaintStatusAdminService(id, {
        status,
        ...(adminRemarks && { adminRemarks }),
      });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);

export const getNotices = createAsyncThunk(
  "admin/getNotices",
  async (category: string | undefined, { rejectWithValue }) => {
    try {
      const params = category && category !== "All Notices" ? { category: category.toLowerCase() } : {};
      const data = await getNoticesAdminService(params);
      return data.notices || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch notices");
    }
  }
);

export const createNotice = createAsyncThunk(
  "admin/createNotice",
  async (noticeData: any, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("title", noticeData.title);
      formData.append("description", noticeData.description);
      formData.append("category", noticeData.category);
      formData.append("priority", noticeData.priority);
      formData.append("visibleFrom", noticeData.visibleFrom);
      formData.append("visibleUntil", noticeData.visibleUntil);
      formData.append("isPinned", noticeData.isPinned);
      formData.append("targetAudience", noticeData.targetAudience);
      if (noticeData.images) {
        formData.append("images", noticeData.images);
      }
      return await createNoticeAdminService(formData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create notice");
    }
  }
);

export const pinNotice = createAsyncThunk(
  "admin/pinNotice",
  async (noticeId: string, { rejectWithValue }) => {
    try {
      const data = await pinNoticeAdminService(noticeId);
      return data.notice || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to pin notice");
    }
  }
);

export const deleteNotice = createAsyncThunk(
  "admin/deleteNotice",
  async (noticeId: string, { rejectWithValue }) => {
    try {
      await deleteNoticeAdminService(noticeId);
      return noticeId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete notice");
    }
  }
);

export const updateNotice = createAsyncThunk(
  "admin/updateNotice",
  async (
    { id, noticeData }: { id: string; noticeData: any },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("title", noticeData.title);
      formData.append("description", noticeData.description);
      formData.append("category", noticeData.category);
      formData.append("priority", noticeData.priority);
      formData.append("visibleFrom", noticeData.visibleFrom);
      formData.append("visibleUntil", noticeData.visibleUntil);
      formData.append("isPinned", noticeData.isPinned);
      formData.append("targetAudience", noticeData.targetAudience);
      if (noticeData.images) {
        formData.append("images", noticeData.images);
      }
      const data = await updateNoticeAdminService(id, formData);
      return data.notice || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update notice");
    }
  }
);

export const createCharge = createAsyncThunk(
  "admin/createCharge",
  async (chargeData: any, { rejectWithValue }) => {
    try {
      return await createChargeAdminService(chargeData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create charge");
    }
  }
);

export const getNoticesResident = createAsyncThunk(
  "admin/getNoticesResident",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getNoticesAdminService();
      return data.notices || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch notices");
    }
  }
);

export const getCharges = createAsyncThunk(
  "admin/getCharges",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getChargesAdminService();
      return data.charges || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch charges");
    }
  }
);

export const getChargeById = createAsyncThunk(
  "admin/getChargeById",
  async (chargeId: string, { rejectWithValue }) => {
    try {
      const data = await getChargeDetailsAdminService(chargeId);
      return data.charge || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch charge");
    }
  }
);

export const updateCharge = createAsyncThunk(
  "admin/updateCharge",
  async ({ id, chargeData }: { id: string; chargeData: any }, { rejectWithValue }) => {
    try {
      const data = await updateChargeAdminService(id, chargeData);
      return data.charge || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update charge");
    }
  }
);

export const deleteCharge = createAsyncThunk(
  "admin/deleteCharge",
  async (chargeId: string, { rejectWithValue }) => {
    try {
      await deleteChargeAdminService(chargeId);
      return chargeId; 
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete charge");
    }
  }
);

export const getPayments = createAsyncThunk(
  "admin/getPayments",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getPaymentsAdminService();
      return data.payments || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch payments");
    }
  }
);

export const approvePayment = createAsyncThunk(
  "admin/approvePayment",
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const data = await reviewPaymentAdminService(paymentId, { status: "approved" });
      return data.payment || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve payment");
    }
  }
);

export const rejectPayment = createAsyncThunk(
  "admin/rejectPayment",
  async (
    { paymentId, rejectionReason }: { paymentId: string; rejectionReason: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await reviewPaymentAdminService(paymentId, { status: "rejected", rejectionReason });
      return data.payment || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject payment");
    }
  }
);

export const addVehicle = createAsyncThunk(
  "admin/addVehicle",
  async ({ userId, data }: { userId: string; data: any }, thunkAPI) => {
    try {
      return await addVehicleAdminService(userId, data);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to add vehicle");
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  "admin/deleteVehicle",
  async ({ userId, vehicleId }: { userId: string; vehicleId: string }, thunkAPI) => {
    try {
      return await deleteVehicleAdminService(userId, vehicleId);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete vehicle");
    }
  }
);

export const getDeactivationRequests = createAsyncThunk(
  "admin/getDeactivationRequests",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDeactivationRequestsAdminService();
      return data.requests || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch requests");
    }
  }
);

export const approveDeactivationRequest = createAsyncThunk(
  "admin/approveDeactivationRequest",
  async (requestId: string, { rejectWithValue }) => {
    try {
      const data = await reviewDeactivationRequestAdminService(requestId, { status: "approved" });
      return data.request || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve request");
    }
  }
);

export const rejectDeactivationRequest = createAsyncThunk(
  "admin/rejectDeactivationRequest",
  async (requestId: string, { rejectWithValue }) => {
    try {
      return await rejectDeactivationRequestAdminService(requestId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject request");
    }
  }
);

export const getUserActivity = createAsyncThunk(
  "admin/getUserActivity",
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await getUserActivityAdminService(userId);
      return data.activities || data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch activity");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Resident
      .addCase(addNewResident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(addNewResident.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(addNewResident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get My Society
      .addCase(getMySociety.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMySociety.fulfilled, (state, action: PayloadAction<Society>) => {
        state.isLoading = false;
        state.society = action.payload;
        state.error = null;
      })
      .addCase(getMySociety.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Residents List
      .addCase(getResidents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getResidents.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.residents = action.payload.users;
      })
      .addCase(getResidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Resident Details
      .addCase(getResidentById.pending, (state) => {
        state.isLoading = true;
        state.selectedResident = null;
      })
      .addCase(getResidentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResident = action.payload;
      })
      .addCase(getResidentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Resident
      .addCase(updateResident.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })

      // Toggle Status
      .addCase(toggleResidentStatus.fulfilled, (state, action: any) => {
        const updatedUser = action.payload;
        const index = state.residents.findIndex((res) => res._id === updatedUser._id);
        if (index !== -1) {
          state.residents[index].isActive = updatedUser.isActive;
        }
      })

      // Admin Profile
      .addCase(getAdminProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAdminProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateAdminProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.isSuccess = true;
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isSuccess = false;
      })

      // Complaints
      .addCase(getComplaints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getComplaints.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.complaints = action.payload;
      })
      .addCase(getComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getComplaintStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getComplaintStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.complaintStats = action.payload;
      })
      .addCase(getComplaintStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateComplaintStatus.fulfilled, (state, action: any) => {
        state.isLoading = false;
        const updatedComplaint = action.payload.complaint;
        const index = state.complaints.findIndex((c: any) => c._id === updatedComplaint._id);
        if (index !== -1) {
          state.complaints[index] = updatedComplaint;
        }
      })

      // Notices
      .addCase(getNotices.pending, (state) => {
        state.noticesLoading = true;
      })
      .addCase(getNotices.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.noticesLoading = false;
        state.notices = action.payload;
      })
      .addCase(getNotices.rejected, (state, action) => {
        state.noticesLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createNotice.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(pinNotice.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.notices.findIndex((n: any) => n._id === updated._id);
        if (index !== -1) {
          state.notices[index] = updated;
        }
      })
      .addCase(deleteNotice.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.notices = state.notices.filter((notice: any) => notice._id !== action.payload);
      })
      .addCase(updateNotice.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.notices.findIndex((n: any) => n._id === updated._id);
        if (index !== -1) {
          state.notices[index] = updated;
        }
      })

      // Charges
      .addCase(getCharges.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCharges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.charges = action.payload;
      })
      .addCase(createCharge.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.charges.unshift(action.payload.charge);
      })
      .addCase(getChargeById.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.selectedCharge = action.payload;
      })
      .addCase(updateCharge.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload;
        const index = state.charges.findIndex((c: any) => c._id === updated._id);
        if (index !== -1) {
          state.charges[index] = updated;
        }
        state.selectedCharge = updated;
      })
      .addCase(deleteCharge.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.charges = state.charges.filter((c: any) => c._id !== action.payload);
      })

      // Payments
      .addCase(getPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPayments.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(approvePayment.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.payments.findIndex((p: any) => p._id === updated._id);
        if (index !== -1) {
          state.payments[index] = updated;
        }
      })
      .addCase(rejectPayment.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.payments.findIndex((p: any) => p._id === updated._id);
        if (index !== -1) {
          state.payments[index] = updated;
        }
      })

      // Vehicles
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResident.vehicles = action.payload.vehicles;
        state.isSuccess = true;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedResident.vehicles = action.payload.vehicles;
        state.isSuccess = true;
      })

      // Deactivation Requests
      .addCase(getDeactivationRequests.pending, (state) => {
        state.deactivationLoading = true;
        state.error = null;
      })
      .addCase(getDeactivationRequests.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.deactivationLoading = false;
        state.deactivationRequests = action.payload;
      })
      .addCase(getDeactivationRequests.rejected, (state, action) => {
        state.deactivationLoading = false;
        state.error = action.payload as string;
      })
      .addCase(approveDeactivationRequest.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.deactivationRequests.findIndex((r: any) => r._id === updated._id);
        if (index !== -1) {
          state.deactivationRequests[index] = updated;
        }
      })
      .addCase(rejectDeactivationRequest.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        const updated = action.payload;
        const index = state.deactivationRequests.findIndex((r: any) => r._id === updated._id);
        if (index !== -1) {
          state.deactivationRequests[index] = updated;
        }
      })

      // Activity
      .addCase(getUserActivity.pending, (state) => {
        state.activityLoading = true;
      })
      .addCase(getUserActivity.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.activityLoading = false;
        state.userActivity = action.payload;
      })

      // Daily Staff Reducers
      .addCase(getStaffLogs.pending, (state) => {
        state.staffLoading = true;
      })
      .addCase(getStaffLogs.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.staffLoading = false;
        state.staffData = action.payload;
      })
      .addCase(getStaffLogs.rejected, (state, action) => {
        state.staffLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getBlockedStaff.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.blockedStaff = action.payload;
      })
      .addCase(createStaff.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(createStaff.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(oneTimeStaffEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(oneTimeStaffEntry.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Auto-add to staff data if it was a new creation or refresh needed
        // The list will be refreshed by the component anyway
      })
      .addCase(oneTimeStaffEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getStaffHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(getStaffHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.historyLoading = false;
        state.staffHistory = action.payload;
      })
      .addCase(getStaffHistory.rejected, (state) => {
        state.historyLoading = false;
      })
      .addCase(searchStaff.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.staffData = action.payload;
      })
      // [MODULE-C]: Verify Staff Reducers
      .addCase(verifyStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyStaff.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedStaff = action.payload.data;
        const index = state.staffData.findIndex((s) => s._id === updatedStaff._id);
        if (index !== -1) {
          state.staffData[index] = updatedStaff;
        }
      })
      .addCase(verifyStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delivery Reducers
      .addCase(getDeliveryLogs.pending, (state) => {
        state.deliveryLoading = true;
      })
      .addCase(getDeliveryLogs.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.deliveryLoading = false;
        state.deliveryData = action.payload;
      })
      .addCase(getDeliveryLogs.rejected, (state, action) => {
        state.deliveryLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createDelivery.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          state.deliveryData.unshift(action.payload.data);
        }
      })
      .addCase(markDeliveryExit.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          const updated = action.payload.data;
          const index = state.deliveryData.findIndex(d => d._id === updated._id);
          if (index !== -1) {
            state.deliveryData[index] = updated;
          }
        }
      })

      // Visitor Reducers
      .addCase(createVisitor.pending, (state) => {
        state.visitorLoading = true;
        state.error = null;
        state.isSuccess = false;
        state.generatedCode = null;
      })
      .addCase(createVisitor.fulfilled, (state, action: any) => {
        state.visitorLoading = false;
        state.isSuccess = true;
        state.generatedCode = action.payload.verificationCode;
        if (action.payload?.data) {
          state.visitorData.unshift(action.payload.data);
        }
      })
      .addCase(createVisitor.rejected, (state, action) => {
        state.visitorLoading = false;
        state.error = action.payload as string;
        state.isSuccess = false;
      })
      .addCase(approveVisitor.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          const updated = action.payload.data;
          const index = state.visitorData.findIndex(v => v._id === updated._id);
          if (index !== -1) {
            state.visitorData[index] = updated;
          }
        }
      })
      .addCase(rejectVisitor.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          const updated = action.payload.data;
          const index = state.visitorData.findIndex(v => v._id === updated._id);
          if (index !== -1) {
            state.visitorData[index] = updated;
          }
        }
      })
      .addCase(markVisitorExit.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          const updated = action.payload.data;
          const index = state.visitorData.findIndex(v => v._id === updated._id);
          if (index !== -1) {
            state.visitorData[index] = updated;
          }
        }
      })
      .addCase(getVisitorHistory.pending, (state) => {
        state.visitorLoading = true;
      })
      .addCase(getVisitorHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.visitorLoading = false;
        state.visitorData = action.payload;
      })
      .addCase(getVisitorHistory.rejected, (state, action) => {
        state.visitorLoading = false;
        state.error = action.payload as string;
      })

      // Document Reducers
      .addCase(getAdminDocuments.pending, (state) => {
        state.documentsLoading = true;
        state.error = null;
      })
      .addCase(getAdminDocuments.fulfilled, (state, action: any) => {
        state.documentsLoading = false;
        // The action.payload is now the array of documents returned from thunk
        state.documents = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
      })
      .addCase(getAdminDocuments.rejected, (state, action) => {
        state.documentsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        // action.payload is the full response { success, message, data }
        if (action.payload?.data) {
          state.documents.unshift(action.payload.data);
        }
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload as string;
      })
      .addCase(updateDocument.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.data) {
          const updated = action.payload.data;
          const index = state.documents.findIndex(d => d._id === updated._id);
          if (index !== -1) {
            state.documents[index] = updated;
          }
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
      })
      .addCase(deleteDocument.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isSuccess = true;
        const id = action.meta.arg;
        state.documents = state.documents.filter(d => d._id !== id);
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
