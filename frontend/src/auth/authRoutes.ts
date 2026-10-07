export const AUTHROUTES = {
    LOGIN : "/auth/login",
    LOGOUT : "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
 
    // SUPER ADMIN ROUTES
    SUPERADMIN_GET_ALL_SOCIETIES : "/superadmin/societies",
    SUPERADMIN_VIEW_SOCIETY_DETAILS : "/superadmin/societies",
    SUPERADMIN_CREATE_SOCIETY: "/superadmin/societies",
    SUPERADMIN_CREATE_SOCIETY_ADMIN: "/superadmin/admins",
 
    SUPERADMIN_TOGGLE_USER_STATUS: "/superadmin/users",

    // SUPER ADMIN SETTINGS
    SUPERADMIN_GET_PLATFORM_CONFIG: "/superadmin/settings/platform",
    SUPERADMIN_UPDATE_PLATFORM_CONFIG: "/superadmin/settings/platform",
    SUPERADMIN_UPDATE_NOTIFICATION_RULES: "/superadmin/settings/notifications",
    SUPERADMIN_GET_PLANS: "/superadmin/settings/plans",
    SUPERADMIN_CREATE_PLAN: "/superadmin/settings/plans",
    SUPERADMIN_UPDATE_PLAN: "/superadmin/settings/plans",
    SUPERADMIN_DELETE_PLAN: "/superadmin/settings/plans",
 
 
    // SOCIETY USER ROUTES
    USER_GET_MY_PROFILE: "/profile",
    USER_UPDATE_MY_PROFILE: "/profile",
    USER_CHANGE_PASSWORD: "/profile/password",
    USER_UPDATE_PREFERENCES: "/profile/preferences",

    // SUPPORT ROUTES
    SUPPORT_CREATE_TICKET: "/support",
    SUPPORT_GET_MY_TICKETS: "/support/my-tickets",
    SUPPORT_GET_ALL_TICKETS: "/support/all",
    SUPPORT_GET_TICKET_DETAILS: "/support", // Base for /:id
    SUPPORT_ADD_MESSAGE: "/support", // Base for /:id/messages
    SUPPORT_UPDATE_STATUS: "/support", // Base for /:id/status
 
    USER_GET_ALL_NOTICES: '/notices',
    USER_GET_ALL_ACTIVE_NOTICES: "/notices",
    USER_GET_NOTICE_DETAILS: '/notices',
    USER_FILTER_NOTICES: '/notices',
 
    USER_GET_MY_CHARGES:"/charges/my",
    USER_GET_MY_SINGLE_CHARGE:"/charges/my",
 
    USER_GET_PAYMENT_HISTORY:"/payments/my",
    USER_SUBMIT_PAYMENT:'/payments',
 
    USER_GET_MY_COMPLAINTS: '/complaints/my',
    USER_VIEW_COMPLAINT_DETAILS: '/complaints',
    USER_SUBMIT_COMPLAINTS: '/complaints',

    // SOCIETY ADMIN ROUTES
    ADMIN_GET_MY_SOCIETY: "/admin/society",
    ADMIN_GET_RESIDENTS: "/admin/users",
    ADMIN_CREATE_RESIDENT: "/admin/users",
    ADMIN_RESIDENT_DETAILS: "/admin/users",
    ADMIN_UPDATE_RESIDENT: "/admin/users",
    ADMIN_TOGGLE_RESIDENT_STATUS: "/admin/users",
    ADMIN_ADD_VEHICLE: "/admin/users",
    ADMIN_DELETE_VEHICLE: "/admin/users",
    ADMIN_USER_ACTIVITY: "/admin/users",
    
    ADMIN_GET_COMPLAINTS: "/complaints",
    ADMIN_GET_COMPLAINT_STATS: "/complaints/stats",
    ADMIN_UPDATE_COMPLAINT_STATUS: "/complaints",

    ADMIN_GET_NOTICES: "/notices",
    ADMIN_CREATE_NOTICE: "/notices",
    ADMIN_UPDATE_NOTICE: "/notices",
    ADMIN_DELETE_NOTICE: "/notices",
    ADMIN_PIN_NOTICE: "/notices",

    ADMIN_GET_CHARGES: "/charges",
    ADMIN_CREATE_CHARGE: "/charges",
    ADMIN_GET_CHARGE_DETAILS: "/charges",
    ADMIN_UPDATE_CHARGE: "/charges",
    ADMIN_DELETE_CHARGE: "/charges",

    ADMIN_GET_PAYMENTS: "/payments",
    ADMIN_REVIEW_PAYMENT: "/payments",

    ADMIN_GET_DEACTIVATION_REQUESTS: "/admin/deactivation-requests",
    ADMIN_REVIEW_DEACTIVATION_REQUEST: "/admin/deactivation-requests",

    // DAILY STAFF ROUTES
    STAFF_CREATE: "/staff/create",
    STAFF_ENTRY: "/staff/entry",
    STAFF_EXIT: "/staff/exit",
    STAFF_GET_LOGS: "/staff/logs",
    STAFF_BLOCK: "/staff/block",
    STAFF_UNBLOCK: "/staff/unblock",
    STAFF_BLOCKED_LIST: "/staff/blocked-list",
    STAFF_SEARCH: "/staff/search",
    STAFF_DIRECTORY: "/staff/directory",
    STAFF_ATTENDANCE_HISTORY: "/staff/attendance-history",
    STAFF_ONE_TIME_ENTRY: "/staff/one-time-entry",
    STAFF_VERIFY: "/staff/verify-member", // [MODULE-C]: Staff verification route

    // DELIVERY ROUTES
    DELIVERY_CREATE: "/delivery/create",
    DELIVERY_EXIT: "/delivery/exit",
    DELIVERY_LOGS: "/delivery/logs",

    // VISITOR ROUTES
    VISITOR_CREATE: "/visitors/create",
    VISITOR_APPROVE: "/visitors/approve",
    VISITOR_REJECT: "/visitors/reject",
    VISITOR_EXIT: "/visitors/exit",
    VISITOR_HISTORY: "/visitors/history",
    // [POINT 3] Surprise visitor / technician gate flow
    VISITOR_GATE_ENTRY: "/visitors/gate-entry",
    VISITOR_RESPOND: "/visitors/respond",
    VISITOR_PENDING_APPROVALS: "/visitors/pending-approvals",

    // DOCUMENT ROUTES
    ADMIN_GET_DOCUMENTS: "/documents",
    ADMIN_CREATE_DOCUMENT: "/documents",
    ADMIN_UPDATE_DOCUMENT: "/documents",
    ADMIN_DELETE_DOCUMENT: "/documents",
    USER_GET_DOCUMENTS: "/documents",

    // PASSWORD RESET ROUTES
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_OTP: "/auth/verify-otp",
    RESET_PASSWORD: "/auth/reset-password",

    // NOTIFICATION ROUTES
    NOTIFICATION_GET_MY: "/notifications/my",
    NOTIFICATION_UNREAD_COUNT: "/notifications/unread-count",
    NOTIFICATION_STATS: "/notifications/stats-overview",
    NOTIFICATION_MARK_READ: "/notifications", // Base for /:id/read
    NOTIFICATION_MARK_ALL_READ: "/notifications/read-all",
    NOTIFICATION_BROADCAST: "/notifications/broadcast",

    // FCM PUSH ROUTES
    NOTIFICATION_FCM_TOKEN: "/notifications/fcm-token", // POST register / DELETE unregister
    NOTIFICATION_PUSH_STATUS: "/notifications/push-status", // admin only, debugging
}
 