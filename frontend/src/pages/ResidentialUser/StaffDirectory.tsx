import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Star, MessageSquare, ShieldCheck, 
  Phone, MapPin, X, Loader2, Send, ChevronDown, Check,
  User, Info, Filter
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from "../../store/store";
import { getStaffDirectory, addStaffRating, getStaffReviews, resetRatingSuccess } from "../../features/User/userSlice";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

const StaffDirectory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { visitorData: staffData, loading, staffReviews, ratingLoading, ratingSuccess } = useAppSelector((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showRatingModal, setShowRatingModal] = useState<any>(null);
  const [showReviewsModal, setShowReviewsModal] = useState<any>(null);
  
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState("");

  const roles = ["All", "Maid", "Cook", "Driver", "Security", "Plumber", "Electrician"];

  useEffect(() => {
    dispatch(getStaffDirectory());
  }, [dispatch]);

  // Handle Outside Click for Custom Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (ratingSuccess) {
      toast.success("Thank you for your review!");
      setShowRatingModal(null);
      setUserReview("");
      setUserRating(5);
      dispatch(resetRatingSuccess());
      dispatch(getStaffDirectory()); 
    }
  }, [ratingSuccess, dispatch]);

  const filteredStaff = (staffData || []).filter((s: any) => {
    const name = s?.staffName || "";
    const role = s?.role || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "All" || role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleSubmitRating = () => {
    if (!userReview.trim()) return toast.error("Please write a short review");
    dispatch(addStaffRating({
      staffId: showRatingModal._id,
      rating: userRating,
      review: userReview
    }));
  };

  const openReviews = (staff: any) => {
    setShowReviewsModal(staff);
    dispatch(getStaffReviews(staff._id));
  };

  return (
    <DashboardLayout role="member">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <Users size={12} /> Community Helpers
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Trusted Staff Directory</h1>
            <p className="text-muted-foreground font-medium max-w-md">Find and rate service providers verified by your society management.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                placeholder="Search by name or role..."
                className="pl-12 pr-6 py-3 bg-card border border-border rounded-2xl w-full sm:w-72 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Custom Role Dropdown */}
            <div className="relative w-full sm:w-48" ref={dropdownRef}>
              <div 
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center justify-between px-5 py-3 bg-card border rounded-2xl cursor-pointer transition-all shadow-sm hover:border-blue-300 ${isRoleDropdownOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-border'}`}
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className={selectedRole !== "All" ? "text-blue-600" : "text-muted-foreground"} />
                  <span className={`text-sm font-bold ${selectedRole !== "All" ? "text-foreground" : "text-muted-foreground"}`}>{selectedRole}</span>
                </div>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden"
                  >
                    <div className="p-1.5">
                      {roles.map((role) => {
                        const isSelected = selectedRole === role;
                        return (
                          <div
                            key={role}
                            onClick={() => {
                              setSelectedRole(role);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-muted/50 text-slate-600'}`}
                          >
                            <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{role}</span>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        {loading && staffData.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <Users className="absolute inset-0 m-auto text-blue-600" size={24} />
            </div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Syncing Directory...</p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStaff.map((staff: any) => (
              <motion.div 
                layout
                key={staff._id}
                className="bg-card rounded-[28px] border border-border shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 z-10">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card/90 backdrop-blur-sm rounded-full border border-border shadow-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${staff.isVerified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                        {staff.isVerified ? 'Verified' : 'Active'}
                      </span>
                   </div>
                </div>

                <div className="p-6">
                  {/* Card Profile Section */}
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                      <div className="w-20 h-20 rounded-[28px] bg-muted flex items-center justify-center text-3xl font-black text-muted-foreground/30 overflow-hidden bg-cover bg-center border-4 border-card shadow-sm"
                           style={{ backgroundImage: staff.photo ? `url(${staff.photo})` : 'none' }}>
                        {!staff.photo && (staff.staffName ? staff.staffName[0] : "?")}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-xl border-2 border-card shadow-sm">
                        <ShieldCheck size={14} />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-foreground leading-tight">{staff.staffName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-primary/20">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stats */}
                  <div className="flex items-center justify-center gap-6 py-4 border-y border-border mb-6 bg-muted/30 rounded-2xl">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-foreground">{staff.averageRating || "0.0"}</span>
                      </div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Avg Rating</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                      <span className="font-bold text-foreground block mb-0.5">{staff.totalReviews || 0}</span>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Reviews</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6 px-2">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
                        <Phone size={14} />
                      </div>
                      <span className="text-xs font-bold">{staff.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <span className="text-xs font-bold">Flat: {staff.flatNumbers?.length ? staff.flatNumbers.join(", ") : (staff.flatNumber || "N/A")}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowRatingModal(staff)}
                      className="py-3 rounded-2xl bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                    >
                      <Star size={14} /> Rate
                    </button>
                    <button 
                      onClick={() => openReviews(staff)}
                      className="py-3 rounded-2xl bg-card border border-border text-foreground text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-muted/50 transition-all active:scale-95 hover:border-primary/20 hover:text-primary"
                    >
                      <MessageSquare size={14} /> Reviews
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-20 h-20 bg-muted/50 rounded-[32px] flex items-center justify-center border border-border">
              <Users size={40} className="opacity-20" />
            </div>
            <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground">No matching helpers found</p>
            <button onClick={() => {setSearchTerm(""); setSelectedRole("All")}} className="text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:underline">Clear all filters</button>
          </div>
        )}

        {/* Rating Modal */}
        <AnimatePresence>
          {showRatingModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={() => setShowRatingModal(null)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
              >
                <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                       <Star size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">Rate Provider</h3>
                      <p className="text-xs text-muted-foreground font-medium">Reviewing {showRatingModal.staffName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRatingModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-muted-foreground">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Star Picker */}
                  <div className="flex flex-col items-center gap-4 py-8 bg-muted/50 rounded-[28px] border border-border">
                    <div className="flex gap-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onMouseEnter={() => setUserRating(star)}
                          onClick={() => setUserRating(star)}
                          className="transition-transform active:scale-90 hover:scale-110"
                        >
                          <Star 
                            size={40} 
                            fill={star <= userRating ? "#f59e0b" : "none"} 
                            className={star <= userRating ? "text-amber-500" : "text-slate-300"} 
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-black text-amber-600 uppercase tracking-[2px]">
                      {userRating === 5 ? "Excellent!" : userRating === 4 ? "Very Good" : userRating === 3 ? "Good Service" : userRating === 2 ? "Below Average" : "Poor"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Write your review</label>
                    <textarea 
                      placeholder="Share your experience (e.g. prompt service, polite behavior)..."
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm min-h-[120px] outline-none focus:border-blue-500 focus:bg-card transition-all resize-none font-medium placeholder:text-muted-foreground"
                      value={userReview}
                      onChange={(e) => setUserReview(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleSubmitRating}
                    disabled={ratingLoading}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                  >
                    {ratingLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Submit Feedback</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reviews List Modal */}
        <AnimatePresence>
          {showReviewsModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={() => setShowReviewsModal(null)} 
              />
              <motion.div 
                initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                className="relative bg-card h-full max-h-[600px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col rounded-[32px]"
              >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-muted/50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                       <MessageSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">Community Reviews</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{showReviewsModal.staffName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReviewsModal(null)} className="p-2 hover:bg-card rounded-xl transition-colors text-muted-foreground border border-transparent hover:border-border">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {ratingLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-blue-600">
                      <Loader2 className="animate-spin" size={32} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fetching reviews...</span>
                    </div>
                  ) : staffReviews.length > 0 ? (
                    staffReviews.map((rev: any) => (
                      <div key={rev._id} className="p-5 bg-card rounded-2xl border border-border shadow-sm hover:border-blue-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {rev.residentId?.name[0] || <User size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{rev.residentId?.name || "Neighbor"}</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{new Date(rev.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < rev.rating ? "#f59e0b" : "none"} className={i < rev.rating ? "text-amber-500" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <div className="relative">
                          <Info size={12} className="absolute -left-1 -top-1 text-blue-50 opacity-20" />
                          <p className="text-xs text-slate-600 leading-relaxed italic font-medium pl-1">"{rev.review}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                      <MessageSquare size={48} className="opacity-10 mb-4" />
                      <p className="font-bold uppercase text-[10px] tracking-widest">Be the first to review!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default StaffDirectory;
