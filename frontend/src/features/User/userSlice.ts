import { 
  changeMyPasswordService, 
  getAllActiveNoticesService, 
  getAllNoticesByUserService, 
  getFilterNoticesByUserService, 
  getMyAllChargesServices, 
  getMyComplaintDetailService, 
  getMyComplaintsService, 
  getMyProfileService, 
  getMySingleChargeService, 
  getSingleNoticeByUserService, 
  getUserPaymentHistoryService, 
  submitComplaintService, 
  updateMyProfileService, 
  userSubmitPaymentService,
  createVisitorService,
  getVisitorHistoryService,
  getPendingApprovalsService,
  respondToGateRequestService,
  getMyPendingOneTimeStaffService,
  respondToOneTimeStaffService,
  addStaffRatingService,
  getStaffReviewsService,
  getStaffDirectoryService,
  getPublicDocumentsService,
  getDashboardSummaryService
} from "@/auth/authServices";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";


interface UserState {
  profileData: any;
  dashboardStats: any;
  loading: boolean;
  dashboardLoading: boolean;
  singleLoading: boolean,
  error: string | null;
  singleViewError: string | null;
  submitError: string | null;
  notices: any[];
  singleNotice: any[];
  myCharges: any[];
  chargeDetails: any[];
  paymentHistory: any[];
  myComplaints: any[];
  complaintDetails: any[];
  // Visitor State
  visitorData: any[];
  visitorLoading: boolean;
  createVisitorSuccess: boolean;
  generatedCode: string | null;
  // [POINT 3] Guard ke bheje hue gate requests jinka resident ko jawab dena hai
  pendingApprovals: any[];
  pendingApprovalsLoading: boolean;
  respondingTo: string | null;
  defaultDurationMins: number;
  // [ONE-TIME] Guard ke bheje hue technician/delivery requests (Staff collection).
  // Visitor wale cards se alag rakhe hain - endpoint aur flow dono alag hain.
  pendingOneTimeStaff: any[];
  pendingOneTimeLoading: boolean;
  respondingToOneTime: string | null;
  // [MODULE-D]: Rating State
  staffReviews: any[];
  ratingLoading: boolean;
  ratingSuccess: boolean;
  // Document State
  documents: any[];
  documentsLoading: boolean;
}

const initialState: UserState = {
  profileData: null,
  dashboardStats: null,
  loading: false,
  dashboardLoading: false,
  singleLoading: false,
  error: null,
  singleViewError: null,
  submitError: null,
  notices: [],
  singleNotice: [],
  myCharges: [],
  chargeDetails: [],
  paymentHistory: [],
  myComplaints: [],
  complaintDetails: [],
  // Visitor Initial State
  visitorData: [],
  visitorLoading: false,
  createVisitorSuccess: false,
  generatedCode: null,
  // [POINT 3] Initial State
  pendingApprovals: [],
  pendingApprovalsLoading: false,
  respondingTo: null,
  pendingOneTimeStaff: [],
  pendingOneTimeLoading: false,
  respondingToOneTime: null,
  defaultDurationMins: 120,
  // [MODULE-D]: Rating Initial State
  staffReviews: [],
  ratingLoading: false,
  ratingSuccess: false,
  // Document Initial State
  documents: [],
  documentsLoading: false,
};

// GET PUBLIC DOCUMENTS THUNK
export const getPublicDocuments = createAsyncThunk<any, any | undefined, { rejectValue: string }>(
  "user/getPublicDocuments",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getPublicDocumentsService(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch documents"
      );
    }
  }
);

// GET DASHBOARD SUMMARY THUNK
export const getDashboardSummary = createAsyncThunk<any, void, { rejectValue: string }>(
  "user/getDashboardSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDashboardSummaryService();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard summary"
      );
    }
  }
);

// GET MY PROFILE THUNK
export const getMyProfile = createAsyncThunk< any,void, { rejectValue: string }>(
    "user/getMyProfile",
 async (_, { rejectWithValue }) => {
  try {
    const response = await getMyProfileService();
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch profile"
    );
  }
});

// UPDATE MY PROFILE THUNK
export const updateMyProfile = createAsyncThunk<any,any, { rejectValue: string } >(
    "user/updateMyProfile", 
async (payload, { rejectWithValue }) => {
  try {
    const response = await updateMyProfileService(payload);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update profile"
    );
  }
});

// CHNANGE PASSWORD THUNK
export const changeMyPassword = createAsyncThunk< any, any, { rejectValue: string }>(
    "user/changeMyPassword", async (payload, { rejectWithValue }) => {
  try {
    const response = await changeMyPasswordService(payload);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to change password"
    );
  }
});

// USER GET ALL NOTICES THUNK
export const getAllUserNoticesThunk = createAsyncThunk<any, void, { rejectValue: string }>(
    'user/getAllUserNotices', 
    async (_, { rejectWithValue })=>{
        try {
            const response = await getAllNoticesByUserService();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get all notices");
        }
    }
);

// USER GET NOTICES BY FILTER
export const getFilteredNoticesThunk = createAsyncThunk<any, string, { rejectValue: string }>(
    'user/getFilterNotices',
    async(category, { rejectWithValue })=>{
        try {
            const response = await getFilterNoticesByUserService(category);
            return response
        } catch (error: any) {
            return rejectWithValue(
                    error.response?.data?.message || "Failed to fetch notices");
        }
    }
)

//GET SINGLE NOTICE IN DETAIL
export const getSingleNotice = createAsyncThunk<any, string, { rejectValue: string}>(
    'user/getSingleNotices',
    async(id, {rejectWithValue})=>{
        try {
            const response = await getSingleNoticeByUserService(id);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get notice details.")
        }
    }
);

//GET ALL ACTIVE NOTICES
export const getAllActiveNotices = createAsyncThunk<any, void, { rejectValue: string }>(
  "user/getAllActiveNotices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllActiveNoticesService();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get active notices"
      );
    }
  }
);

// USER GET MY ALL CHARGES
export const getMyAllCharges = createAsyncThunk<any, Record<string, any> | void, {rejectValue: string}>(
    'user/getMyAllCharges',
    async (filters: Record<string, any> = {}, {rejectWithValue}) => {
        try {
            const response = await getMyAllChargesServices(filters);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get ALL charges");
        }
    }
)

//USER GET SINGLE CHARGE DETAILS
export const getSingleChargeDetails = createAsyncThunk<any, string, { rejectValue: string }>(
    'user/getMyChargeDetails',
    async(id, {rejectWithValue})=>{
        try {
            const response = await getMySingleChargeService(id);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get charge details");
        }
    }
);

// USER GET PAYMENT HISTORY
export const getUserPayemntHistory = createAsyncThunk<any, Record<string, any> | void,{rejectValue: string}>(
    'user/getUserPaymentHistory',
    async(filters: Record<string, any> = {}, {rejectWithValue})=>{
        try {
            const response = await getUserPaymentHistoryService(filters);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get payment history");
        }
    }
);

//USER SUBMIT PAYMENT
export const userSubmitPayment = createAsyncThunk<any, FormData,{rejectValue: string}>(
    'user/submitPayment',
    async(payload, {rejectWithValue})=>{
        try {
            const response = await userSubmitPaymentService(payload);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit payment details");
        }
    }
);

//USER GET MY ALL COMPLAINNTS 
export const getMyComplaints = createAsyncThunk<any, Record<string, any> | void, {rejectValue: string}>(
    'user/getMyComplaints',
    async(filters: Record<string, any> = {}, {rejectWithValue}) =>{
        try {
            const response = await getMyComplaintsService(filters);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get complaints");
        }
    }
)

//USER VIEW COMPLAINT DETAILS
export const viewComplaintDetails = createAsyncThunk<any, string, { rejectValue: string}>(
    'user/viewComplaintDetails',
    async(id, {rejectWithValue})=>{
        try {
            const response = await getMyComplaintDetailService(id);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to get complaits details");
        }
    }
)

//USER SUBMIT COMPLAINTS
export const submitComplaint = createAsyncThunk<any, FormData, {rejectValue: string}>(
    'user/sumitComplaint',
    async(payload, {rejectWithValue} )=>{
        try {
            const response = await submitComplaintService(payload);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit complaint");
        }
    }
)
// USER CREATE VISITOR THUNK
export const createVisitor = createAsyncThunk<any, any, { rejectValue: any }>(
  "user/createVisitor",
  async (visitorData, { rejectWithValue }) => {
    try {
      const response = await createVisitorService(visitorData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Visitor creation failed" }
      );
    }
  }
);

// USER GET VISITOR HISTORY THUNK
export const getVisitorHistory = createAsyncThunk<any, string, { rejectValue: string }>(
  "user/getVisitorHistory",
  async (flatNumber, { rejectWithValue }) => {
    try {
      const response = await getVisitorHistoryService(flatNumber);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch visitor history"
      );
    }
  }
);

// [POINT 3] RESIDENT KE PENDING GATE APPROVALS
export const getPendingApprovals = createAsyncThunk<any, void, { rejectValue: string }>(
  "user/getPendingApprovals",
  async (_, { rejectWithValue }) => {
    try {
      return await getPendingApprovalsService();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending approvals"
      );
    }
  }
);

// [POINT 3] RESIDENT APPROVE / REJECT GATE REQUEST
export const respondToGateRequest = createAsyncThunk<
  any,
  { visitorId: string; action: "approve" | "reject"; allowedDurationMins?: number; rejectionReason?: string },
  { rejectValue: string }
>(
  "user/respondToGateRequest",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await respondToGateRequestService(payload);
      return { ...response, visitorId: payload.visitorId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to respond to gate request"
      );
    }
  }
);

// [ONE-TIME] RESIDENT KE PENDING TECHNICIAN / DELIVERY REQUESTS
export const getPendingOneTimeStaff = createAsyncThunk<any, void, { rejectValue: string }>(
  "user/getPendingOneTimeStaff",
  async (_, { rejectWithValue }) => {
    try {
      return await getMyPendingOneTimeStaffService();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending one-time approvals"
      );
    }
  }
);

// [ONE-TIME] RESIDENT APPROVE / REJECT — approve par backend attendance laga deta hai
export const respondToOneTimeStaff = createAsyncThunk<
  any,
  { staffId: string; action: "approve" | "reject"; rejectionReason?: string },
  { rejectValue: string }
>(
  "user/respondToOneTimeStaff",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await respondToOneTimeStaffService(payload);
      return { ...response, staffId: payload.staffId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to respond to one-time request"
      );
    }
  }
);

// [MODULE-D]: ADD STAFF RATING THUNK
export const addStaffRating = createAsyncThunk(
  "user/addStaffRating",
  async (payload: { staffId: string, rating: number, review: string }, { rejectWithValue }) => {
    try {
      const response = await addStaffRatingService(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit rating");
    }
  }
);

// [MODULE-D]: GET STAFF REVIEWS THUNK
export const getStaffReviews = createAsyncThunk(
  "user/getStaffReviews",
  async (staffId: string, { rejectWithValue }) => {
    try {
      const response = await getStaffReviewsService(staffId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

// [MODULE-D]: GET STAFF DIRECTORY THUNK
export const getStaffDirectory = createAsyncThunk(
  "user/getStaffDirectory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getStaffDirectoryService();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch directory");
    }
  }
);



const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        },
        clearChargeDetails: (state) => {
            state.chargeDetails = [];
        },
        clearSingleNotice: (state) => {
            state.singleNotice = [];
        },
        resetRatingSuccess: (state) => {
            state.ratingSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder

        .addCase(getMyProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getMyProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.profileData = action.payload.user || action.payload;
        })
        .addCase(getMyProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Error fetching profile";
        })

        .addCase(getDashboardSummary.pending, (state) => {
            state.dashboardLoading = true;
            state.error = null;
        })
        .addCase(getDashboardSummary.fulfilled, (state, action) => {
            state.dashboardLoading = false;
            state.dashboardStats = action.payload;
        })
        .addCase(getDashboardSummary.rejected, (state, action) => {
            state.dashboardLoading = false;
            state.error = action.payload || "Error fetching dashboard summary";
        })

        .addCase(updateMyProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateMyProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.profileData = action.payload.user || action.payload;
        })
        .addCase(updateMyProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Error updating profile";
        })

        .addCase(changeMyPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(changeMyPassword.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(changeMyPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Error changing password";
        })

        .addCase(getAllUserNoticesThunk.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(getAllUserNoticesThunk.fulfilled, (state, action)=>{
            state.loading = false;
            state.notices = action.payload.notices || action.payload;
        })
        .addCase(getAllUserNoticesThunk.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload || "Failed to get All Notices";
        })

        .addCase(getFilteredNoticesThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getFilteredNoticesThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.notices = action.payload.notices || action.payload;
        })
        .addCase(getFilteredNoticesThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Something went wrong";
        })

        .addCase(getAllActiveNotices.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getAllActiveNotices.fulfilled, (state, action) => {
            state.loading = false;
            state.notices = action.payload.notices || action.payload;
        })
        .addCase(getAllActiveNotices.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Something went wrong";
        })
        //GET SINGLE NOTICE
        .addCase(getSingleNotice.pending, (state)=>{
            state.singleLoading = true;
            state.error = null;
        })
        .addCase(getSingleNotice.fulfilled, (state, action)=>{
            state.singleLoading = false;
            state.singleNotice = action.payload.notice;
        })
        .addCase(getSingleNotice.rejected, (state, action)=>{
            state.singleLoading = false;
            state.error = action.payload;
        })

        // GET MY ALL CHARGES
        .addCase(getMyAllCharges.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(getMyAllCharges.fulfilled, (state, action)=>{
            state.loading = false;
            state.myCharges = action.payload;
        })
        .addCase(getMyAllCharges.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        })

        .addCase(getSingleChargeDetails.pending, (state)=>{
            state.singleLoading = true;
            state.error = null;
        })
        .addCase(getSingleChargeDetails.fulfilled, (state, action)=>{
            state.singleLoading = false;
            state.chargeDetails = action.payload;
        })
        .addCase(getSingleChargeDetails.rejected, (state, action)=>{
            state.singleLoading = false;
            state.error = action.payload;
        })

        // getPayemnt history
        .addCase(getUserPayemntHistory.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(getUserPayemntHistory.fulfilled, (state, action)=>{
            state.loading = false;
            state.paymentHistory = action.payload;
        })
        .addCase(getUserPayemntHistory.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        })

        // user submit payment
        .addCase(userSubmitPayment.pending, (state)=>{
            state.singleLoading = true;
            state.submitError = null;
        })
        .addCase(userSubmitPayment.fulfilled, (state)=>{
            state.singleLoading = false;
        })
        .addCase(userSubmitPayment.rejected, (state,action)=>{
            state.singleLoading = false;
            state.submitError = action.payload;
        })

        // user get my complaints
        .addCase(getMyComplaints.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(getMyComplaints.fulfilled, (state, action)=>{
            state.loading = false;
            state.myComplaints = action.payload;
        })
        .addCase(getMyComplaints.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload;
        })

        // USER VIEW COMPLAINT DETAILS
        .addCase(viewComplaintDetails.pending, (state)=>{
            state.singleLoading = true;
            state.singleViewError = null;
        })
        .addCase(viewComplaintDetails.fulfilled, (state, action)=>{
            state.singleLoading = false;
            state.complaintDetails = action.payload.complaint;
        })
        .addCase(viewComplaintDetails.rejected, (state, action)=>{
            state.singleLoading = true;
            state.singleViewError = action.payload;
        })

        // USER SUBMIT COMPLAINT
        .addCase(submitComplaint.pending, (state)=>{
            state.singleLoading = true;
            state.submitError = null;
        })
        .addCase(submitComplaint.fulfilled, (state)=>{
            state.singleLoading = false;
        })
        .addCase(submitComplaint.rejected, (state, action)=>{
            state.singleLoading = false;
            state.submitError = action.payload;
        })

        // USER CREATE VISITOR
        .addCase(createVisitor.pending, (state) => {
            state.visitorLoading = true;
            state.error = null;
            state.createVisitorSuccess = false;
            state.generatedCode = null;
        })
        .addCase(createVisitor.fulfilled, (state, action) => {
            state.visitorLoading = false;
            state.createVisitorSuccess = true;
            state.generatedCode = action.payload.verificationCode;
            state.visitorData.unshift(action.payload.data);
        })
        .addCase(createVisitor.rejected, (state, action) => {
            state.visitorLoading = false;
            // SAFE CHECK: Ensure error is a string for React rendering
            const errorPayload: any = action.payload;
            state.error = errorPayload?.message || errorPayload?.error || (typeof errorPayload === 'string' ? errorPayload : "Visitor creation failed");
            state.createVisitorSuccess = false;
        })

        // USER GET VISITOR HISTORY
        .addCase(getVisitorHistory.pending, (state) => {
            state.visitorLoading = true;
        })
        .addCase(getVisitorHistory.fulfilled, (state, action) => {
            state.visitorLoading = false;
            // The thunk already returns response.data (the array), so we use it directly
            state.visitorData = action.payload || [];
        })
        .addCase(getVisitorHistory.rejected, (state, action) => {
            state.visitorLoading = false;
            state.error = action.payload as string;
        })

        // [POINT 3] PENDING GATE APPROVALS
        .addCase(getPendingApprovals.pending, (state) => {
            state.pendingApprovalsLoading = true;
        })
        .addCase(getPendingApprovals.fulfilled, (state, action) => {
            state.pendingApprovalsLoading = false;
            state.pendingApprovals = action.payload?.data || [];
            if (action.payload?.defaultDurationMins) {
                state.defaultDurationMins = action.payload.defaultDurationMins;
            }
        })
        .addCase(getPendingApprovals.rejected, (state, action) => {
            state.pendingApprovalsLoading = false;
            state.error = action.payload as string;
        })

        // [POINT 3] RESPOND TO GATE REQUEST
        .addCase(respondToGateRequest.pending, (state, action) => {
            state.respondingTo = action.meta.arg.visitorId;
            state.error = null;
        })
        .addCase(respondToGateRequest.fulfilled, (state, action) => {
            state.respondingTo = null;
            // Jawab de diya, card list se hata do
            state.pendingApprovals = state.pendingApprovals.filter(
                (v: any) => v._id !== action.payload.visitorId
            );
        })
        .addCase(respondToGateRequest.rejected, (state, action) => {
            state.respondingTo = null;
            state.error = action.payload as string;
        })

        // [ONE-TIME] PENDING TECHNICIAN / DELIVERY REQUESTS
        .addCase(getPendingOneTimeStaff.pending, (state) => {
            state.pendingOneTimeLoading = true;
        })
        .addCase(getPendingOneTimeStaff.fulfilled, (state, action) => {
            state.pendingOneTimeLoading = false;
            state.pendingOneTimeStaff = action.payload?.data || [];
        })
        .addCase(getPendingOneTimeStaff.rejected, (state, action) => {
            state.pendingOneTimeLoading = false;
            state.error = action.payload as string;
        })

        // [ONE-TIME] RESPOND TO TECHNICIAN / DELIVERY REQUEST
        .addCase(respondToOneTimeStaff.pending, (state, action) => {
            state.respondingToOneTime = action.meta.arg.staffId;
            state.error = null;
        })
        .addCase(respondToOneTimeStaff.fulfilled, (state, action) => {
            state.respondingToOneTime = null;
            // Jawab de diya, card list se hata do
            state.pendingOneTimeStaff = state.pendingOneTimeStaff.filter(
                (s: any) => s._id !== action.payload.staffId
            );
        })
        .addCase(respondToOneTimeStaff.rejected, (state, action) => {
            state.respondingToOneTime = null;
            state.error = action.payload as string;
        })

        // [MODULE-D]: STAFF RATINGS REDUCERS
        .addCase(addStaffRating.pending, (state) => {
          state.ratingLoading = true;
          state.ratingSuccess = false;
          state.error = null;
        })
        .addCase(addStaffRating.fulfilled, (state) => {
          state.ratingLoading = false;
          state.ratingSuccess = true;
        })
        .addCase(addStaffRating.rejected, (state, action) => {
          state.ratingLoading = false;
          state.error = action.payload as string;
        })

        .addCase(getStaffReviews.pending, (state) => {
          state.ratingLoading = true;
        })
        .addCase(getStaffReviews.fulfilled, (state, action) => {
          state.ratingLoading = false;
          state.staffReviews = action.payload || [];
        })
        .addCase(getStaffReviews.rejected, (state, action) => {
          state.ratingLoading = false;
          state.error = action.payload as string;
        })

        .addCase(getStaffDirectory.pending, (state) => {
          state.loading = true;
        })
        .addCase(getStaffDirectory.fulfilled, (state, action) => {
          state.loading = false;
          state.visitorData = action.payload || []; // Using visitorData as general staff storage for now
        })
        .addCase(getStaffDirectory.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })

        // GET PUBLIC DOCUMENTS
        .addCase(getPublicDocuments.pending, (state) => {
          state.documentsLoading = true;
          state.error = null;
        })
        .addCase(getPublicDocuments.fulfilled, (state, action) => {
          state.documentsLoading = false;
          // Action payload might be the array or the full object { success, total, data }
          state.documents = Array.isArray(action.payload) ? action.payload : (action.payload as any)?.data || [];
        })
        .addCase(getPublicDocuments.rejected, (state, action) => {
          state.documentsLoading = false;
          state.error = action.payload as string;
        });

    }
})

export const { clearChargeDetails, clearSingleNotice, clearUserError, resetRatingSuccess } = userSlice.actions;
export default userSlice.reducer;