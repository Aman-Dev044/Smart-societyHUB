import axiosInstance from "./axiosInstance";
import { AUTHROUTES } from "./authRoutes";
 
export interface LoginPayload {
  email: string;
  password: string;
}
 
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
 
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    society: string | null;
  };
}
 
const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(AUTHROUTES.LOGIN, payload);
    return data;
  },
 
    logout: async (): Promise<{ message: string }> => {
    const { data } = await axiosInstance.post(
      AUTHROUTES.LOGOUT
    );
    return data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const { data } = await axiosInstance.post(AUTHROUTES.FORGOT_PASSWORD, { email });
    return data;
  },

  verifyOTP: async (email: string, otp: string): Promise<any> => {
    const { data } = await axiosInstance.post(AUTHROUTES.VERIFY_OTP, { email, otp });
    return data;
  },

  resetPassword: async (payload: any): Promise<any> => {
    const { data } = await axiosInstance.post(AUTHROUTES.RESET_PASSWORD, payload);
    return data;
  },
};
  
 
export default authService;
 
 
// SUPERADMIN SERVICES
 
export const getAllSocietiesSuperAdminService = async (): Promise<any> => {
  const response = await axiosInstance.get(
    AUTHROUTES.SUPERADMIN_GET_ALL_SOCIETIES
  );
 
  return response.data;
};
 
//SUPERADMIN VIEW SOCIETY DETAILS
export const getSocietyDetailsSuperAdminService = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(
    `${AUTHROUTES.SUPERADMIN_VIEW_SOCIETY_DETAILS}/${id}`
  );
  return response.data;
}
 
//SUPERADMIN CREATE SOCIETY
export const createSocietyBySuperAdminService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.post(
    AUTHROUTES.SUPERADMIN_CREATE_SOCIETY,
    payload
  );
  return response.data;
}
 
// SUPERADMIN CREATE SOCIETY ADMIN
export const createSocietyAdminBySuperAdminService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.post(
    AUTHROUTES.SUPERADMIN_CREATE_SOCIETY_ADMIN,
    payload
  );
  return response.data;
}
 
//SUPERADMIN TOGGLE USER STATUS
export const toggleUserStatusBySuperAdminService = async (id: string): Promise<any> => {
  const response = await axiosInstance.patch(
    `${AUTHROUTES.SUPERADMIN_TOGGLE_USER_STATUS}/${id}/toggle-status`
  );
  return response.data;
}

// SUPER ADMIN SETTINGS SERVICES

export const getPlatformConfigService = async (): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.SUPERADMIN_GET_PLATFORM_CONFIG);
  return response.data;
};

export const updatePlatformConfigService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.patch(AUTHROUTES.SUPERADMIN_UPDATE_PLATFORM_CONFIG, payload);
  return response.data;
};

export const updateNotificationRulesService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.patch(AUTHROUTES.SUPERADMIN_UPDATE_NOTIFICATION_RULES, payload);
  return response.data;
};

export const getPlansService = async (): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.SUPERADMIN_GET_PLANS);
  return response.data;
};

export const createPlanService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.post(AUTHROUTES.SUPERADMIN_CREATE_PLAN, payload);
  return response.data;
};

export const updatePlanService = async (id: string, payload: any): Promise<any> => {
  const response = await axiosInstance.patch(`${AUTHROUTES.SUPERADMIN_UPDATE_PLAN}/${id}`, payload);
  return response.data;
};

export const deletePlanService = async (id: string): Promise<any> => {
  const response = await axiosInstance.delete(`${AUTHROUTES.SUPERADMIN_DELETE_PLAN}/${id}`);
  return response.data;
};

 
// SOCIETY USER SERVICES
 
// SOCIETY USER GET OWN PROFILE
export const getMyProfileService = async (): Promise<any> => {
  const response = await axiosInstance.get(
    AUTHROUTES.USER_GET_MY_PROFILE
  );
  return response.data;
}

// SOCIETY USER GET DASHBOARD SUMMARY
export const getDashboardSummaryService = async (): Promise<any> => {
  const response = await axiosInstance.get(
    `${AUTHROUTES.USER_GET_MY_PROFILE}/dashboard-summary`
  );
  return response.data;
}

export const getAdminProfileService = getMyProfileService;
 
//USER UPDATE OWN PROFILE
export const updateMyProfileService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.patch(
    AUTHROUTES.USER_UPDATE_MY_PROFILE,
    payload
  );
  return response.data;
}

export const updateAdminProfileService = updateMyProfileService;
 
// USER CHANGE PASSWORD
export const changeMyPasswordService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.patch(
    AUTHROUTES.USER_CHANGE_PASSWORD,
    payload
  );
  return response.data;
}
 
//USER GET ALL NOTICES
export const getAllNoticesByUserService = async (): Promise<any> => {
  const response = await axiosInstance.get(
    AUTHROUTES.USER_GET_ALL_NOTICES,
  );
  return response.data;
}
 
// USER FILTER NOTICE DETAILS
export const getFilterNoticesByUserService = async (category: string): Promise<any> =>{
  const response = await axiosInstance.get(
    AUTHROUTES.USER_FILTER_NOTICES,
     {
      params: { category },
    }
  );
  return response.data
}
 
// USER GET SINGLE NOTICE
export const getSingleNoticeByUserService = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(
    `${AUTHROUTES.USER_GET_NOTICE_DETAILS}/${id}`
  );
  return response.data;
}
 
//USER GET ALL ACTIVE NOTICES
export const getAllActiveNoticesService = async (): Promise<any> => {
  const response = await axiosInstance.get(
    AUTHROUTES.USER_GET_ALL_ACTIVE_NOTICES,
    {
      params: { active: true }
    }
  );
  return response.data;
};
 
 
// USER GET MY ALL CHARGES
export const getMyAllChargesServices = async (filters = {}): Promise<any> => {
  const response = await axiosInstance.get(
    AUTHROUTES.USER_GET_MY_CHARGES,{
      params: filters
    }
  );
  return response.data;
}
 
//USER VIEW MY SINGLE CHARGE IN DETAIL
export const getMySingleChargeService = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(
    `${AUTHROUTES.USER_GET_MY_SINGLE_CHARGE}/${id}`
  );
  return response.data;
}
 
//GET USER PAYMENT HISTORY
export const getUserPaymentHistoryService = async (filters={}): Promise<any>=>{
  const response = await  axiosInstance.get(
    AUTHROUTES.USER_GET_PAYMENT_HISTORY,{
      params: filters
    }
  );
  return response.data;
}
 
// USER SUBMIT PAYMENT
export const userSubmitPaymentService = async(payload: any): Promise<any>=>{
  const response = await axiosInstance.post(
    AUTHROUTES.USER_SUBMIT_PAYMENT,
    payload
  );
  return response.data;
}
 
//USER GET MY COMPLAINTS
export const getMyComplaintsService = async(filters = {}): Promise<any>=>{
  const response = await axiosInstance.get(
    AUTHROUTES.USER_GET_MY_COMPLAINTS,{
      params: filters
    }
  );
  return response.data;
}
 
//USER VIEW COMPLAINT DETAILS
export const getMyComplaintDetailService = async(id: string): Promise<any>=>{
  const response = await axiosInstance.get(
    `${AUTHROUTES.USER_VIEW_COMPLAINT_DETAILS}/${id}`
  );
  return response.data;
}
 
//USER SUBMIT COMPLAINT
export const submitComplaintService = async(payload: any): Promise<any>=>{
  const response = await axiosInstance.post(
    AUTHROUTES.USER_SUBMIT_COMPLAINTS,
    payload,
    );
    return response. data;
    }

    // SOCIETY ADMIN SERVICES

    // GET MY SOCIETY
    export const getMySocietyAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_MY_SOCIETY, {
    headers: { "Cache-Control": "no-cache" },
    params: { ts: Date.now() },
    });
    return response.data;
    };

    // GET RESIDENTS
    export const getResidentsAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_RESIDENTS);
    return response.data;
    };

    // CREATE RESIDENT
    export const createResidentAdminService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.ADMIN_CREATE_RESIDENT, payload);
    return response.data;
    };

    // GET RESIDENT DETAILS
    export const getResidentDetailsAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`${AUTHROUTES.ADMIN_RESIDENT_DETAILS}/${id}`);
    return response.data;
    };

    // UPDATE RESIDENT
    export const updateResidentAdminService = async (id: string, payload: any): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_UPDATE_RESIDENT}/${id}`, payload);
    return response.data;
    };

    // TOGGLE RESIDENT STATUS
    export const toggleResidentStatusAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_TOGGLE_RESIDENT_STATUS}/${id}/toggle-status`);
    return response.data;
    };

    // ADD VEHICLE
    export const addVehicleAdminService = async (userId: string, payload: any): Promise<any> => {
    const response = await axiosInstance.post(`${AUTHROUTES.ADMIN_ADD_VEHICLE}/${userId}/vehicles`, payload);
    return response.data;
    };

    // DELETE VEHICLE
    export const deleteVehicleAdminService = async (userId: string, vehicleId: string): Promise<any> => {
    const response = await axiosInstance.delete(`${AUTHROUTES.ADMIN_DELETE_VEHICLE}/${userId}/vehicles/${vehicleId}`);
    return response.data;
    };

    // USER ACTIVITY
    export const getUserActivityAdminService = async (userId: string): Promise<any> => {
    const response = await axiosInstance.get(`${AUTHROUTES.ADMIN_USER_ACTIVITY}/${userId}/activity`);
    return response.data;
    };

    // GET COMPLAINTS
    export const getComplaintsAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_COMPLAINTS);
    return response.data;
    };

    // GET COMPLAINT STATS
    export const getComplaintStatsAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_COMPLAINT_STATS);
    return response.data;
    };

    // UPDATE COMPLAINT STATUS
    export const updateComplaintStatusAdminService = async (id: string, payload: any): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_UPDATE_COMPLAINT_STATUS}/${id}/status`, payload);
    return response.data;
    };

    // GET NOTICES
    export const getNoticesAdminService = async (params = {}): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_NOTICES, { params });
    return response.data;
    };

    // CREATE NOTICE
    export const createNoticeAdminService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.ADMIN_CREATE_NOTICE, payload, {
    headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
    };

    // UPDATE NOTICE
    export const updateNoticeAdminService = async (id: string, payload: any): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_UPDATE_NOTICE}/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
    };

    // DELETE NOTICE
    export const deleteNoticeAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`${AUTHROUTES.ADMIN_DELETE_NOTICE}/${id}`);
    return response.data;
    };

    // PIN NOTICE
    export const pinNoticeAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_PIN_NOTICE}/${id}/pin`);
    return response.data;
    };

    // GET CHARGES
    export const getChargesAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_CHARGES);
    return response.data;
    };

    // CREATE CHARGE
    export const createChargeAdminService = async (payload: any): Promise<any> => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post(AUTHROUTES.ADMIN_CREATE_CHARGE, payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
    });
    return response.data;
    };

    // GET CHARGE DETAILS
    export const getChargeDetailsAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`${AUTHROUTES.ADMIN_GET_CHARGE_DETAILS}/${id}`);
    return response.data;
    };

    // UPDATE CHARGE
    export const updateChargeAdminService = async (id: string, payload: any): Promise<any> => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_UPDATE_CHARGE}/${id}`, payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
    });
    return response.data;
    };

    // DELETE CHARGE
    export const deleteChargeAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`${AUTHROUTES.ADMIN_DELETE_CHARGE}/${id}`);
    return response.data;
    };

    // GET PAYMENTS
    export const getPaymentsAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_PAYMENTS);
    return response.data;
    };

    // REVIEW PAYMENT
    export const reviewPaymentAdminService = async (id: string, payload: any): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_REVIEW_PAYMENT}/${id}/review`, payload);
    return response.data;
    };

    // GET DEACTIVATION REQUESTS
    export const getDeactivationRequestsAdminService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_DEACTIVATION_REQUESTS);
    return response.data;
    };

    // REVIEW DEACTIVATION REQUEST
    export const reviewDeactivationRequestAdminService = async (id: string, payload: any): Promise<any> => {
    const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_REVIEW_DEACTIVATION_REQUEST}/${id}/review`, payload);
    return response.data;
    };

    // REJECT DEACTIVATION REQUEST (Using delete as per existing slice)
    export const rejectDeactivationRequestAdminService = async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`${AUTHROUTES.ADMIN_REVIEW_DEACTIVATION_REQUEST}/${id}/review`);
    return response.data;
    };

    // DAILY STAFF SERVICES
// createStaffService
    export const createStaffService = async (payload: any): Promise<any> => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post(AUTHROUTES.STAFF_CREATE, payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
    });
    return response.data;
    };
// markStaffEntryService
    export const markStaffEntryService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.STAFF_ENTRY, payload);
    return response.data;
    };
// markStaffExitService
    export const markStaffExitService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.STAFF_EXIT, payload);
    return response.data;
    };
// getStaffLogsService
    export const getStaffLogsService = async (type?: string): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.STAFF_GET_LOGS, {
      params: { type }
    });
    return response.data;
    };
// oneTimeStaffEntryService
    export const oneTimeStaffEntryService = async (payload: any): Promise<any> => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post(AUTHROUTES.STAFF_ONE_TIME_ENTRY, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
    });
    return response.data;
    };
// blockStaffService
    export const blockStaffService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.STAFF_BLOCK, payload);
    return response.data;
    };
// unblockStaffService
    export const unblockStaffService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.STAFF_UNBLOCK, payload);
    return response.data;
    };
// getBlockedStaffService
    export const getBlockedStaffService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.STAFF_BLOCKED_LIST);
    return response.data;
    };
// getStaffDirectoryService
    export const getStaffDirectoryService = async (): Promise<any> => {
      const response = await axiosInstance.get(AUTHROUTES.STAFF_DIRECTORY);
      return response.data;
    };
// searchStaffService
    export const searchStaffService = async (params: any): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.STAFF_SEARCH, { params });
    return response.data;
    };
// getStaffAttendanceHistoryService
    export const getStaffAttendanceHistoryService = async (staffId: string): Promise<any> => {
    const response = await axiosInstance.get(`${AUTHROUTES.STAFF_ATTENDANCE_HISTORY}/${staffId}`);
    return response.data;
    };

    // [MODULE-C]: VERIFY STAFF SERVICE
    export const verifyStaffService = async (staffId: string, payload?: any): Promise<any> => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.patch(`${AUTHROUTES.STAFF_VERIFY}/${staffId}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
    });
    return response.data;
    };

    // [MODULE-D]: RATING SERVICES
    export const addStaffRatingService = async (payload: { staffId: string, rating: number, review: string }): Promise<any> => {
      const response = await axiosInstance.post("/ratings/add", payload);
      return response.data;
    };
// getStaffReviewsService
    export const getStaffReviewsService = async (staffId: string): Promise<any> => {
      const response = await axiosInstance.get(`/ratings/staff/${staffId}`);
      return response.data;
    };

    // DELIVERY SERVICES

    export const createDeliveryService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.DELIVERY_CREATE, payload);
    return response.data;
    };

    export const markDeliveryExitService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.DELIVERY_EXIT, payload);
    return response.data;
    };

    export const getDeliveryLogsService = async (): Promise<any> => {
    const response = await axiosInstance.get(AUTHROUTES.DELIVERY_LOGS);
    return response.data;
    };

    // VISITOR SERVICES

    export const createVisitorService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.VISITOR_CREATE, payload);
    return response.data;
    };

    export const approveVisitorService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.VISITOR_APPROVE, payload);
    return response.data;
    };

    export const rejectVisitorService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.VISITOR_REJECT, payload);
    return response.data;
    };

    export const markVisitorExitService = async (payload: any): Promise<any> => {
    const response = await axiosInstance.post(AUTHROUTES.VISITOR_EXIT, payload);
    return response.data;
    };

    export const getVisitorHistoryService = async (flatNumber: string): Promise<any> => {
  const response = await axiosInstance.get(`${AUTHROUTES.VISITOR_HISTORY}/${flatNumber}`);
  return response.data;
};

// [POINT 3] Guard gate par surprise visitor / technician capture karta hai (photo ke saath)
export const gateEntryService = async (formData: FormData): Promise<any> => {
  const response = await axiosInstance.post(AUTHROUTES.VISITOR_GATE_ENTRY, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// [POINT 3] Resident gate request ko approve / reject karta hai
export const respondToGateRequestService = async (payload: {
  visitorId: string;
  action: "approve" | "reject";
  allowedDurationMins?: number;
  rejectionReason?: string;
}): Promise<any> => {
  const response = await axiosInstance.post(AUTHROUTES.VISITOR_RESPOND, payload);
  return response.data;
};

// [POINT 3] Resident ke pending approval cards
export const getPendingApprovalsService = async (): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.VISITOR_PENDING_APPROVALS);
  return response.data;
};

// DOCUMENT SERVICES
export const uploadDocumentService = async (formData: FormData): Promise<any> => {
  const response = await axiosInstance.post(AUTHROUTES.ADMIN_CREATE_DOCUMENT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAdminDocumentsService = async (): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.ADMIN_GET_DOCUMENTS);
  return response.data;
};

export const getPublicDocumentsService = async (params?: any): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.USER_GET_DOCUMENTS, { params });
  return response.data;
};

export const updateDocumentService = async (id: string, formData: FormData): Promise<any> => {
  const response = await axiosInstance.patch(`${AUTHROUTES.ADMIN_UPDATE_DOCUMENT}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteDocumentService = async (id: string): Promise<any> => {
  const response = await axiosInstance.delete(`${AUTHROUTES.ADMIN_DELETE_DOCUMENT}/${id}`);
  return response.data;
};

// SUPPORT SERVICES
export const createSupportTicketService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.post(AUTHROUTES.SUPPORT_CREATE_TICKET, payload);
  return response.data;
};

export const getMySupportTicketsService = async (): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.SUPPORT_GET_MY_TICKETS);
  return response.data;
};

export const getAllSupportTicketsService = async (params = {}): Promise<any> => {
  const response = await axiosInstance.get(AUTHROUTES.SUPPORT_GET_ALL_TICKETS, { params });
  return response.data;
};

export const getSupportTicketDetailsService = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(`${AUTHROUTES.SUPPORT_GET_TICKET_DETAILS}/${id}`);
  return response.data;
};

export const addSupportTicketMessageService = async (id: string, payload: any): Promise<any> => {
  const response = await axiosInstance.post(`${AUTHROUTES.SUPPORT_ADD_MESSAGE}/${id}/messages`, payload);
  return response.data;
};

export const updateSupportTicketStatusService = async (id: string, payload: any): Promise<any> => {
  const response = await axiosInstance.patch(`${AUTHROUTES.SUPPORT_UPDATE_STATUS}/${id}/status`, payload);
  return response.data;
};

// PREFERENCES SERVICES
export const updateMyPreferencesService = async (payload: any): Promise<any> => {
  const response = await axiosInstance.patch(AUTHROUTES.USER_UPDATE_PREFERENCES, payload);
  return response.data;
};