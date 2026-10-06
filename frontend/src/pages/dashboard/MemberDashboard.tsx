import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, Bell, MessageSquare, Upload, 
  CheckCircle, Clock, UserPlus, ShieldCheck, 
  XCircle, Loader2, Phone, MapPin, Info, Users, Car, Timer, ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { createVisitor, getVisitorHistory, clearUserError, getMyProfile, getDashboardSummary, getPendingApprovals, respondToGateRequest } from "../../features/User/userSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const inputCls = "w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:bg-background transition-colors placeholder:text-muted-foreground";

const paymentHistory = [
  { type: "Maintenance", amount: "₹5,500", date: "Nov 5, 2024", status: "approved" },
  { type: "Maintenance", amount: "₹5,500", date: "Oct 5, 2024", status: "approved" },
  { type: "Club Membership", amount: "₹2,000", date: "Oct 15, 2024", status: "approved" },
];

export default function MemberDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { 
    profileData, 
    dashboardStats, 
    dashboardLoading,
    visitorData, 
    visitorLoading, 
    createVisitorSuccess, 
    generatedCode, 
    error 
  } = useAppSelector((state) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Use profileData if available, otherwise fallback to auth user
  const currentUser = profileData || user;
  const userFlat = currentUser?.unit?.flatNumber || "";

  const pendingPaymentsList = dashboardStats?.pendingPayments || [];
  const recentNoticesList = dashboardStats?.recentNotices || [];

  const [newVisitor, setNewVisitor] = useState({
    visitorName: "",
    visitorPhone: "",
    vehicleNumber: "",
    purpose: "Guest",
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    flatNumber: "",
  });

  // [POINT 3] Guard ke bheje hue gate requests
  const { pendingApprovals, respondingTo, defaultDurationMins } = useAppSelector(
    (state) => state.user
  );
  // Har card ka apna duration selection (default = backend ka standard time)
  const [durationFor, setDurationFor] = useState<Record<string, number>>({});

  const DURATION_OPTIONS = [30, 60, 120, 240];

  const handleGateResponse = (visitorId: string, action: "approve" | "reject") => {
    dispatch(
      respondToGateRequest({
        visitorId,
        action,
        allowedDurationMins: durationFor[visitorId] || defaultDurationMins,
      })
    ).then((res: any) => {
      if (res.meta.requestStatus === "fulfilled") {
        toast.success(res.payload?.message || "Response bhej diya gaya");
      } else {
        toast.error(res.payload || "Response fail ho gaya");
      }
    });
  };

  // 1. Fetch Profile and Dashboard Summary
  useEffect(() => {
    dispatch(getMyProfile());
    dispatch(getDashboardSummary());
  }, [dispatch]);

  // [POINT 3] Pending gate requests - har 10 second par check, taaki guard ki
  // request turant card ban kar dikhe.
  useEffect(() => {
    dispatch(getPendingApprovals());
    const id = setInterval(() => dispatch(getPendingApprovals()), 10000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    if (userFlat) {
      dispatch(getVisitorHistory(userFlat));
      setNewVisitor(prev => ({ ...prev, flatNumber: userFlat }));
    }
  }, [dispatch, userFlat]);

  // 2. Success/Error Feedback
  useEffect(() => {
    if (createVisitorSuccess) {
      toast.success("Visitor created successfully!");
      setShowAddModal(false);
      setShowSuccessModal(true);
      // Re-fetch history to show the new entry
      if (userFlat) dispatch(getVisitorHistory(userFlat));
    }
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [createVisitorSuccess, error, dispatch, userFlat]);

  const handleCreateVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeUser = profileData || user;
    const finalMemberId = activeUser?.id || activeUser?._id;
    const finalFlat = newVisitor.flatNumber || userFlat;

    // SANITIZATION: Remove spaces, brackets, and dashes from phone number
    const sanitizedPhone = newVisitor.visitorPhone.replace(/\D/g, '');

    if (!finalMemberId) return toast.error("User ID missing. Please refresh.");
    if (!finalFlat) return toast.error("Flat number is required.");
    if (sanitizedPhone.length < 10) return toast.error("Please enter a valid 10-digit phone number.");

    const payload = {
      visitorName: newVisitor.visitorName.trim(),
      visitorPhone: sanitizedPhone,
      vehicleNumber: newVisitor.vehicleNumber.trim(),
      purpose: newVisitor.purpose,
      visitDate: newVisitor.visitDate,
      visitTime: newVisitor.visitTime,
      flatNumber: finalFlat,
      memberId: finalMemberId
    };

    dispatch(createVisitor(payload));
  };

  return (
    <DashboardLayout role="member">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Welcome, {currentUser?.name || 'Resident'}!</h1>
            <p className="text-muted-foreground">{currentUser?.unit?.flatNumber ? `Flat ${currentUser.unit.flatNumber}` : 'Green Valley Apartments'}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAddModal(true)}
              className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/10"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Pre-Approve Visitor
            </Button>
          </div>
        </div>

        {/* [POINT 3] Guard ki bheji hui entry requests - approve / reject */}
        {pendingApprovals && pendingApprovals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
              </div>
              <h3 className="text-sm font-black text-destructive uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Entry Request from Guard ({pendingApprovals.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {pendingApprovals.map((v: any) => {
                const busy = respondingTo === v._id;
                const mins = durationFor[v._id] || defaultDurationMins;
                return (
                  <div key={v._id} className="bg-card border border-destructive/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {v.photo ? (
                        <img src={v.photo} alt="" className="w-16 h-16 rounded-xl object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold text-lg shrink-0">
                          {v.visitorName?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">{v.visitorName}</p>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{v.purpose}</p>
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {v.visitorPhone}
                          </p>
                          {v.vehicleNumber && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <Car className="w-3 h-3" /> {v.vehicleNumber}
                            </p>
                          )}
                          {v.createdByGuard?.name && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" /> Guard: {v.createdByGuard.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kitni der ke liye access dena hai */}
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Timer className="w-3 h-3" /> Allow for
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setDurationFor((d) => ({ ...d, [v._id]: opt }))}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                              mins === opt
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {opt < 60 ? `${opt} min` : `${opt / 60} hr`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={() => handleGateResponse(v._id, "approve")}
                        disabled={busy}
                        className="flex-1 rounded-xl h-10 font-bold"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Approve</>}
                      </Button>
                      <Button
                        onClick={() => handleGateResponse(v._id, "reject")}
                        disabled={busy}
                        variant="outline"
                        className="rounded-xl h-10 font-bold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 card-shadow cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/member/payments')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-warning">
                <CreditCard className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            {dashboardLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : (
              <p className="text-3xl font-heading font-bold">₹{dashboardStats?.stats?.pendingDues?.toLocaleString() || 0}</p>
            )}
            <p className="text-muted-foreground text-sm">Pending Dues</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 card-shadow cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/member/notices')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-info">
                <Bell className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            {dashboardLoading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : (
              <p className="text-3xl font-heading font-bold">{dashboardStats?.stats?.newNoticesCount || 0}</p>
            )}
            <p className="text-muted-foreground text-sm">New Notices</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 card-shadow cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/member/staff-directory')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-600">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">Explore</p>
            <p className="text-muted-foreground text-sm">Staff Directory</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 card-shadow cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/member/support')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-success">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">Support</p>
            <p className="text-muted-foreground text-sm">Help Desk</p>
          </motion.div>
        </div>

        {/* Visitor Management Section */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold">Scheduled Visitors</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ongoing & Upcoming</p>
          </div>
          <div className="p-0">
            {visitorLoading && visitorData.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="text-primary animate-spin" size={32} />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fetching Visitors...</p>
              </div>
            ) : visitorData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visitor Info</th>
                      <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Purpose</th>
                      <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entry Code</th>
                      <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visitorData.map((v: any) => (
                      <tr key={v._id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {v.visitorName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{v.visitorName}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{v.visitDate} • {v.visitTime}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-muted-foreground">{v.purpose}</span>
                        </td>
                        <td className="py-4 px-6">
                          {v.status === 'Pending' ? (
                            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg font-black text-xs tracking-widest shadow-sm">
                              {v.verificationCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs font-bold italic">Used</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                            v.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                <UserPlus size={48} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No visitors scheduled</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  + Add your first visitor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Dues */}
        <div className="bg-card rounded-2xl card-shadow">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold">Payment Dues</h2>
            <Button onClick={() => navigate('/member/payments')}>
              <Upload className="w-4 h-4" />
              Upload Payment Proof
            </Button>
          </div>
          <div className="p-4 space-y-4">
            {dashboardLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingPaymentsList.length > 0 ? (
              pendingPaymentsList.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === "PAID" ? "bg-success/20" : "bg-warning/20"
                    }`}>
                      {payment.status === "PAID" ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.title}</p>
                      <p className="text-sm text-muted-foreground">Due: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === "PAID" 
                        ? "bg-success/10 text-success" 
                        : payment.status === 'AWAITING_VERIFICATION'
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {payment.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm italic">
                No pending dues. You're all caught up! ✨
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Notices */}
          <div className="bg-card rounded-2xl card-shadow">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">Recent Notices</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/member/notices')}>View All</Button>
            </div>
            <div className="p-4 space-y-4">
              {dashboardLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : recentNoticesList.length > 0 ? (
                recentNoticesList.map((notice: any) => (
                  <div key={notice._id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <Bell className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{notice.title}</p>
                      <p className="text-sm text-muted-foreground">{new Date(notice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                      {notice.category}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground text-sm italic">
                  No recent notices.
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-card rounded-2xl card-shadow">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">Payment History</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="p-4 space-y-4">
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.type}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{payment.amount}</p>
                    <span className="text-xs text-success">Approved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Pre-Approve Visitor</h3>
                  <p className="text-sm text-muted-foreground font-medium">Generate a secure entry code</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors border border-transparent hover:border-border">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateVisitor}>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Visitor Name</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Shivam"
                      className={inputCls} 
                      value={newVisitor.visitorName}
                      onChange={(e) => setNewVisitor({...newVisitor, visitorName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" required
                      placeholder="e.g. 9759477504"
                      className={inputCls} 
                      value={newVisitor.visitorPhone}
                      onChange={(e) => setNewVisitor({...newVisitor, visitorPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Purpose of Visit</label>
                    <select 
                      className={inputCls}
                      value={newVisitor.purpose}
                      onChange={(e) => setNewVisitor({...newVisitor, purpose: e.target.value})}
                    >
                      <option value="Guest">Guest</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Vehicle Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. UP32AB1234"
                      className={inputCls} 
                      value={newVisitor.vehicleNumber}
                      onChange={(e) => setNewVisitor({...newVisitor, vehicleNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Visit Date</label>
                    <input 
                      type="date" required
                      className={inputCls} 
                      value={newVisitor.visitDate}
                      onChange={(e) => setNewVisitor({...newVisitor, visitDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Visit Time</label>
                    <input 
                      type="text" required
                      placeholder="e.g. 10:30 AM"
                      className={inputCls} 
                      value={newVisitor.visitTime}
                      onChange={(e) => setNewVisitor({...newVisitor, visitTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 text-left">
                  <Info className="text-primary shrink-0" size={20} />
                  <p className="text-[11px] font-medium text-primary leading-relaxed">
                    Once created, you will receive a 4-digit code. Share this with your visitor to allow them entry at the gate.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-muted/50 border-t border-border flex items-center gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-card transition-all">Cancel</button>
                <button 
                  type="submit" 
                  disabled={visitorLoading}
                  className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {visitorLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Create & Get Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal (Showing Verification Code) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-card rounded-[40px] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden border border-border">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-success/10 text-success rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Visitor Approved!</h3>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Please share this entry code with your visitor</p>
              
              <div className="mt-10 mb-10 py-8 bg-muted border-2 border-border rounded-[32px] relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-[0.02]" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Verification Code</p>
                <p className="text-6xl font-black text-primary tracking-[8px]">{generatedCode || '####'}</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 text-left space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin size={16} className="text-primary" />
                      </div>
                      <p className="text-xs font-bold text-foreground">Flat {user?.unit?.flatNumber}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded-xl flex items-center justify-center shadow-sm">
                        <Phone size={16} className="text-primary" />
                      </div>
                      <p className="text-xs font-bold text-foreground">{newVisitor.visitorPhone || 'Visitor Mobile'}</p>
                   </div>
                </div>

                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 rounded-2xl font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Done
                </button>
                <button 
                   onClick={() => {
                     const text = `Hi, I have pre-approved your visit. Your entry code is: ${generatedCode}. Please show this to the guard at the gate.`;
                     window.open(`https://wa.me/${newVisitor.visitorPhone}?text=${encodeURIComponent(text)}`, '_blank');
                   }}
                   className="w-full py-4 rounded-2xl font-bold text-sm bg-card text-success border border-success/20 hover:bg-success/5 transition-all flex items-center justify-center gap-2"
                >
                  Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
