import { useState, useEffect, useRef } from 'react';
import { 
  Users, Plus, Search, MapPin, Phone, Car, Clock, 
  ShieldAlert, CheckCircle2, XCircle, MoreVertical,
  Filter, Calendar, UserPlus, ArrowRightLeft, UserX,
  UserCheck, ShieldCheck, LogIn, LogOut, Ban, Info, Loader2,
  ChevronDown, Check, X, Truck, History, Camera, Timer
} from 'lucide-react';
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { 
 getStaffLogs, 
 getBlockedStaff, 
 createStaff, 
 markStaffEntry, 
 markStaffExit, 
 blockStaff, 
 unblockStaff, 
 getStaffHistory, 
 searchStaff,
 resetAdminState,
 oneTimeStaffEntry,
 getDeliveryLogs,
 createDelivery,
 markDeliveryExit,
 getVisitorHistory,
 approveVisitor,
 rejectVisitor,
 markVisitorExit,
 verifyStaff,
 gateEntry
} from "../../features/admin/adminSlice";
import { toast } from "sonner";

const inputCls = "w-full bg-muted/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-blue-400 focus:bg-card transition-colors placeholder:text-muted-foreground";

const DailyStaff = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // Persistent Role Check
  const userRole = user?.role || localStorage.getItem('role') || 'guard';
  const isAdmin = userRole === 'society_admin';
  const isGuard = userRole === 'guard';

  const { 
    staffData, 
    blockedStaff, 
    staffLoading, 
    isLoading, 
    staffHistory, 
    historyLoading, 
    isSuccess,  
    error,
    deliveryData,
    deliveryLoading,
    visitorData,
    visitorLoading,
    society 
  } = useAppSelector((state) => state.admin);

  const [mainTab, setMainTab] = useState<'staff' | 'delivery' | 'visitor'>('staff');
  const [activeTab, setActiveTab] = useState<'directory' | 'logs' | 'blocked'>('directory');
  const [deliveryTab, setDeliveryTab] = useState<'active' | 'history'>('active');
  const [visitorTab, setVisitorTab] = useState<'pending' | 'inside' | 'history'>('pending');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<any>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<any>(null);
  const [blockReason, setBlockReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [staffTypeFilter, setStaffTypeFilter] = useState<'Daily' | 'One-time' | 'All'>('All');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Handle Outside Click for Custom Dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [newStaff, setNewStaff] = useState<any>({
    staffName: "",
    mobileNumber: "",
    role: [],
    flatNumbers: [],
    vehicleNumber: "",
    photo: null,
    aadharCard: null,
    policeVerification: null
  });

  const [oneTimeStaff, setOneTimeStaff] = useState<any>({
    staffName: "",
    mobileNumber: "",
    photo: null
  });

  // [POINT 3] Gate entry (surprise visitor / technician) modal
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateVisitor, setGateVisitor] = useState<any>({
    visitorName: "",
    visitorPhone: "",
    vehicleNumber: "",
    purpose: "",
    flatNumber: "",
    photo: null,
  });
  const [gateSubmitting, setGateSubmitting] = useState(false);

  // Staff ek se zyada flats me kaam kar sakta hai - chip input ka draft text
  const [flatDraft, setFlatDraft] = useState("");

  const addFlat = () => {
    const flat = flatDraft.trim();
    if (!flat) return;
    const already = newStaff.flatNumbers.some(
      (f: string) => f.toLowerCase() === flat.toLowerCase()
    );
    if (already) return setFlatDraft("");
    setNewStaff({ ...newStaff, flatNumbers: [...newStaff.flatNumbers, flat] });
    setFlatDraft("");
  };

  const removeFlat = (flat: string) =>
    setNewStaff({
      ...newStaff,
      flatNumbers: newStaff.flatNumbers.filter((f: string) => f !== flat),
    });

  // Staff ke flats display ke liye. Purane records me sirf flatNumber hota hai.
  const flatsLabel = (staff: any) => {
    if (staff?.flatNumbers?.length) return staff.flatNumbers.join(", ");
    return staff?.flatNumber || "N/A";
  };

  const [newDelivery, setNewDelivery] = useState({
    deliveryBoyName: "",
    companyName: "",
    mobileNumber: "",
    flatNumber: "",
    vehicleNumber: ""
  });

  // [POINT 3] Guard gate par visitor capture karke resident ko request bhejta hai
  const handleGateEntry = () => {
    const { visitorName, visitorPhone, flatNumber, purpose } = gateVisitor;
    if (!visitorName || !visitorPhone || !flatNumber || !purpose) {
      return toast.error("Name, Phone, Flat Number aur Purpose zaroori hain");
    }

    const fd = new FormData();
    fd.append("visitorName", visitorName);
    fd.append("visitorPhone", visitorPhone);
    fd.append("flatNumber", flatNumber);
    fd.append("purpose", purpose);
    if (gateVisitor.vehicleNumber) fd.append("vehicleNumber", gateVisitor.vehicleNumber);
    if (gateVisitor.photo) fd.append("photo", gateVisitor.photo);

    setGateSubmitting(true);
    dispatch(gateEntry(fd)).then((res: any) => {
      setGateSubmitting(false);
      if (res.meta.requestStatus === "fulfilled") {
        toast.success(res.payload?.message || "Request resident ko bhej di gayi");
        setShowGateModal(false);
        setGateVisitor({ visitorName: "", visitorPhone: "", vehicleNumber: "", purpose: "", flatNumber: "", photo: null });
        dispatch(getVisitorHistory('All'));
      } else {
        toast.error(res.payload || "Gate entry failed");
      }
    });
  };

  const roleOptions = ["Maid", "Cook", "Driver", "Security", "Plumber", "Electrician"];
  const deliveryCompanies = ["Amazon", "Flipkart", "Zomato", "Swiggy", "Blinkit", "BigBasket", "Other"];

  // 1. Initial Fetch
  useEffect(() => {
    if (mainTab === 'staff') {
      dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
    } else if (mainTab === 'delivery') {
      dispatch(getDeliveryLogs());
    } else {
      dispatch(getVisitorHistory('All'));
    }
  }, [dispatch, mainTab, staffTypeFilter]);

  // [POINT 3] Visitor tab par polling - resident approve kare to guard ki
  // screen 10 second me apne aap update ho jaye.
  useEffect(() => {
    if (mainTab !== 'visitor') return;
    const id = setInterval(() => dispatch(getVisitorHistory('All')), 10000);
    return () => clearInterval(id);
  }, [mainTab, dispatch]);

  // 2. Lazy Load Blocked List
  useEffect(() => {
    if (mainTab === 'staff' && activeTab === 'blocked') {
      dispatch(getBlockedStaff());
    }
  }, [activeTab, mainTab, dispatch]);

  // Success/Error Feedback Logic
  useEffect(() => {
    if (isSuccess) {
      if (showAddModal) {
        setShowAddModal(false);
        setNewStaff({ staffName: "", mobileNumber: "", role: [], flatNumbers: [], vehicleNumber: "", photo: null, aadharCard: null, policeVerification: null });
        setFlatDraft("");
      }
      if (showOneTimeModal) {
        setShowOneTimeModal(false);
        setOneTimeStaff({ staffName: "", mobileNumber: "", photo: null });
        dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
      }
      if (showDeliveryModal) {
        setShowDeliveryModal(false);
        setNewDelivery({ deliveryBoyName: "", companyName: "", mobileNumber: "", flatNumber: "", vehicleNumber: "" });
      }
      if (showBlockModal) {
        setShowBlockModal(null);
        setBlockReason("");
      }
      if (showVerifyModal) {
        setShowVerifyModal(null);
      }
      dispatch(resetAdminState());
    }
    if (error) {
      toast.error(error);
      dispatch(resetAdminState());
    }
  }, [isSuccess, error, dispatch, staffTypeFilter]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaff.role.length === 0) return toast.error("Please select at least one role");
    if (newStaff.flatNumbers.length === 0) return toast.error("Kam se kam ek flat add karein");
    
    const formData = new FormData();
    formData.append("staffName", newStaff.staffName);
    formData.append("mobileNumber", newStaff.mobileNumber);
    formData.append("role", newStaff.role.join(", "));
    formData.append("flatNumbers", JSON.stringify(newStaff.flatNumbers));
    formData.append("vehicleNumber", newStaff.vehicleNumber);
    if (newStaff.photo) formData.append("photo", newStaff.photo);
    if (newStaff.aadharCard) formData.append("aadharCard", newStaff.aadharCard);
    if (newStaff.policeVerification) formData.append("policeVerification", newStaff.policeVerification);

    dispatch(createStaff(formData)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Staff registered successfully");
        dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
      }
    });
  };

  const handleOneTimeEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("staffName", oneTimeStaff.staffName);
    formData.append("mobileNumber", oneTimeStaff.mobileNumber);
    if (oneTimeStaff.photo) formData.append("photo", oneTimeStaff.photo);

    dispatch(oneTimeStaffEntry(formData)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("One-time entry marked successfully");
        dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
      }
    });
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createDelivery(newDelivery)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Delivery entry created");
      }
    });
  };

  const handleDeliveryExit = (deliveryId: string) => {
    dispatch(markDeliveryExit(deliveryId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Delivery exit marked");
      }
    });
  };

  const handleApproveVisitor = (visitorId: string) => {
    if (!enteredCode) return toast.error("Please enter the verification code");
    setIsVerifying(true);
    dispatch(approveVisitor({ visitorId, codeEnteredByGuard: enteredCode })).then((res: any) => {
      setIsVerifying(false);
      if (res.payload?.success) {
        toast.success("Visitor entry approved");
        setEnteredCode("");
        setShowVerifyModal(null);
      }
    });
  };

  const handleRejectVisitor = (visitorId: string) => {
    dispatch(rejectVisitor(visitorId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Visitor entry rejected");
      }
    });
  };

  const handleVisitorExit = (visitorId: string) => {
    dispatch(markVisitorExit(visitorId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Visitor exit marked");
      }
    });
  };

  const toggleRole = (role: string) => {
    const currentRoles = [...newStaff.role];
    const index = currentRoles.indexOf(role);
    if (index === -1) {
      currentRoles.push(role);
    } else {
      currentRoles.splice(index, 1);
    }
    setNewStaff({ ...newStaff, role: currentRoles });
  };

  const handleEntry = (staffId: string) => {
    dispatch(markStaffEntry(staffId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Entry marked successfully");
        dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
      }
    });
  };

  const handleExit = (staffId: string) => {
    dispatch(markStaffExit(staffId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Exit marked successfully");
        dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
      }
    });
  };

  const handleBlock = () => {
    if (!blockReason) return toast.error("Please provide a reason");
    dispatch(blockStaff({ staffId: showBlockModal._id, blockedReason: blockReason }));
  };

  const handleUnblock = (staffId: string) => {
    dispatch(unblockStaff(staffId)).then((res: any) => {
      if (res.payload?.success) {
        toast.success("Staff unblocked successfully");
      }
    });
  };

  const openHistory = (staff: any) => {
    setShowHistoryModal(staff);
    dispatch(getStaffHistory(staff._id));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length > 2) {
      dispatch(searchStaff(searchQuery));
    } else if (searchQuery.length === 0) {
      dispatch(getStaffLogs(staffTypeFilter === 'All' ? undefined : staffTypeFilter));
    }
  };

  const handleVerifyStaff = (staffId: string) => {
    dispatch(verifyStaff({ staffId })).then((res: any) => {
       if (res.payload?.success) {
         toast.success("Staff identity verified");
       }
    });
  };

  const StatsCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-200 hover:scale-[1.02] transition-all active:scale-95 group"
    >
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">{title}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const getStatusInfo = (staff: any) => {
    if (staff.status === 'Blocked') return { label: 'Blocked', color: 'bg-destructive/10 text-destructive', icon: Ban };
    if (!staff.todayLog) return { label: 'Not In', color: 'bg-muted text-muted-foreground', icon: Clock };
    if (staff.todayLog.exitTime) return { label: 'Left Today', color: 'bg-primary/10 text-primary', icon: LogOut };
    // Overstay: entry ke baad threshold se zyada der ho gayi, exit mark nahi hua
    if (staff.todayLog.isOverstay) return { label: 'Overstay', color: 'bg-destructive/10 text-destructive', icon: ShieldAlert };
    return { label: 'Inside', color: 'bg-success/10 text-success', icon: LogIn };
  };

  // Jo Daily staff apne allowed time se zyada der andar hain.
  const overstayStaff = (staffData || []).filter((s: any) => s.todayLog?.isOverstay);

  return (
    <DashboardLayout role={userRole === 'guard' ? 'guard' : 'society-admin'}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/10">
               <ShieldCheck className="text-primary-foreground" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Security & Movement</h1>
              <p className="text-sm text-muted-foreground font-medium">Real-time tracking of staff and deliveries</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl border border-border">
            <button 
              onClick={() => setMainTab('staff')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'staff' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users size={18} /> Daily Staff
            </button>
            <button 
              onClick={() => setMainTab('delivery')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'delivery' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Truck size={18} /> Deliveries
            </button>
            <button 
              onClick={() => setMainTab('visitor')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'visitor' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <UserPlus size={18} /> Visitors
            </button>
          </div>
        </div>

        {mainTab === 'staff' ? (
          <>
            {/* Overstay Security Alert — staff jo allowed time se zyada andar hain */}
            {overstayStaff.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                  </div>
                  <h3 className="text-sm font-black text-destructive uppercase tracking-wide flex items-center gap-2">
                    <ShieldAlert size={16} /> Security Alert — {overstayStaff.length} Staff Overstaying
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {overstayStaff.map((staff: any) => (
                    <div key={staff._id} className="flex items-center justify-between gap-3 bg-card border border-destructive/20 rounded-2xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{staff.staffName}</p>
                        <p className="text-[11px] font-semibold text-muted-foreground truncate">
                          {staff.role} · Flat {flatsLabel(staff)} · {staff.todayLog.hoursInside} hrs inside
                        </p>
                      </div>
                      {isGuard && (
                        <button
                          onClick={() => handleExit(staff._id)}
                          className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <LogOut size={13} strokeWidth={3} /> Mark Exit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Total Registered" 
                value={(staffData?.length || 0) + (blockedStaff?.length || 0)} 
                icon={Users} 
                color="bg-primary/10 text-primary"
                onClick={() => setActiveTab('directory')}
              />
              <StatsCard 
                title="Currently In" 
                value={(staffData || []).filter(s => s.todayLog && !s.todayLog.exitTime).length} 
                icon={UserCheck} 
                color="bg-success/10 text-success"
                onClick={() => setActiveTab('logs')}
              />
              <StatsCard 
                title="Left Today" 
                value={(staffData || []).filter(s => s.todayLog?.exitTime).length} 
                icon={LogOut} 
                color="bg-warning/10 text-warning"
                onClick={() => setActiveTab('logs')}
              />
              <StatsCard 
                title="Blocked Staff" 
                value={blockedStaff?.length || 0} 
                icon={UserX} 
                color="bg-destructive/10 text-destructive"
                onClick={() => setActiveTab('blocked')}
              />
            </div>

            {/* Staff Content */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden min-h-[600px]">
              <div className="border-b border-border p-2 flex flex-col md:flex-row md:items-center justify-between bg-muted/30 gap-4">
                <div className="flex gap-1 overflow-x-auto">
                  {[
                    { id: 'directory', label: 'Directory', icon: Users },
                    { id: 'logs', label: 'Movement', icon: Clock },
                    { id: 'blocked', label: 'Blocked', icon: ShieldAlert },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? "bg-card text-primary shadow-sm border border-border" 
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <form onSubmit={handleSearch} className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search name/phone..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary w-full md:w-64 transition-all text-foreground"
                    />
                  </form>

                  {activeTab === 'logs' && (
                    <div className="relative" ref={typeDropdownRef}>
                      <div 
                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        className={`min-h-[38px] w-40 bg-card border ${isTypeDropdownOpen ? 'border-primary ring-2 ring-primary/10' : 'border-border'} rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer transition-all hover:border-primary/50 group`}
                      >
                        <span className="text-xs font-bold text-foreground">
                          {staffTypeFilter === 'All' ? 'All Staff' : staffTypeFilter === 'Daily' ? 'Daily Staff' : 'One-time Visitors'}
                        </span>
                        <ChevronDown size={14} className={`text-muted-foreground group-hover:text-primary transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isTypeDropdownOpen && (
                        <div className="absolute z-[100] w-full mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-1.5">
                            {['All', 'Daily', 'One-time'].map((type) => {
                              const isSelected = staffTypeFilter === type;
                              return (
                                <div
                                  key={type}
                                  onClick={() => {
                                    setStaffTypeFilter(type as any);
                                    setIsTypeDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                                  }`}
                                >
                                  <span className="text-xs font-bold">{type === 'All' ? 'All Staff' : type === 'Daily' ? 'Daily Staff' : 'One-time Visitors'}</span>
                                  {isSelected && <Check size={12} className="text-primary" strokeWidth={4} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => setShowOneTimeModal(true)}
                    className={`flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${!isGuard ? 'hidden' : ''}`}
                  >
                    <UserPlus size={16} /> One-time Entry
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                    >
                      <Plus size={16} /> Register
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {staffLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Staff Data...</p>
                  </div>
                ) : activeTab === 'directory' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(staffData || []).length > 0 ? staffData.map((staff) => {
                      const status = getStatusInfo(staff);
                      const isOneTime = staff.staffType === "One-time";
                      return (
                        <div key={staff._id} className={`group bg-card border ${isOneTime ? 'border-success/20 hover:border-success/40' : 'border-border hover:border-primary/40'} rounded-2xl p-5 hover:shadow-md transition-all`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${isOneTime ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'} flex items-center justify-center font-bold overflow-hidden border border-border`}>
                              {staff.photo ? (
                                <img src={staff.photo} alt={staff.staffName} className="w-full h-full object-cover" />
                              ) : (
                                staff.staffName.charAt(0)
                              )}
                            </div>
                            <div className="flex gap-1 flex-col items-end">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${status.color}`}>
                                <status.icon size={10} />
                                {status.label}
                              </span>
                              {isOneTime && (
                                <span className="bg-success/10 text-success text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1">Temporary</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-1.5 leading-tight">
                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{staff.staffName}</h4>
                                {staff.isVerified && (
                                  <div className="bg-primary rounded-full p-0.5" title="Verified Staff">
                                    <Check className="text-primary-foreground" size={8} strokeWidth={5} />
                                  </div>
                                )}
                              </div>
                              <p className={`text-[11px] font-bold ${isOneTime ? 'text-success' : 'text-primary'} uppercase tracking-widest mt-0.5`}>{staff.role}</p>
                            </div>

                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2.5 text-muted-foreground">
                                <Phone size={14} />
                                <span className="text-xs font-semibold">{staff.mobileNumber}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-muted-foreground">
                                <MapPin size={14} />
                                <span className="text-xs font-semibold">Flat: {flatsLabel(staff)}</span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-3">
                              {/* Primary Movement Action */}
                              <div className="h-10">
                                {!staff.todayLog ? (
                                  <button 
                                    onClick={() => handleEntry(staff._id)}
                                    className="w-full h-full bg-success hover:bg-success/90 text-success-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                  >
                                    <LogIn size={14} strokeWidth={3} /> Mark Entry
                                  </button>
                                ) : !staff.todayLog.exitTime ? (
                                  <button 
                                    onClick={() => handleExit(staff._id)}
                                    className="w-full h-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                  >
                                    <LogOut size={14} strokeWidth={3} /> Mark Exit
                                  </button>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                                    Shift Done: {new Date(staff.todayLog.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>

                              {/* Secondary Admin Actions Grid */}
                              <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => openHistory(staff)}
                                  className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border transition-all group"
                                  title="View History"
                                >
                                  <Calendar size={13} className="group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">History</span>
                                </button>

                                {isAdmin && (
                                  <>
                                    <button 
                                      onClick={() => handleVerifyStaff(staff._id)}
                                      disabled={staff.isVerified}
                                      className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all group ${
                                        staff.isVerified 
                                        ? "bg-success/10 text-success border border-success/20 cursor-default" 
                                        : "bg-muted text-muted-foreground hover:bg-success/10 hover:text-success border border-border"
                                      }`}
                                      title={staff.isVerified ? "Verified" : "Verify Staff"}
                                    >
                                      {staff.isVerified ? <ShieldCheck size={13} strokeWidth={3} /> : <ShieldAlert size={13} />}
                                      <span className="text-[10px] font-black uppercase tracking-tighter">
                                        {staff.isVerified ? "Verified" : "Verify"}
                                      </span>
                                    </button>

                                    <button 
                                      onClick={() => setShowBlockModal(staff)}
                                      className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border transition-all group"
                                      title="Block Staff"
                                    >
                                      <UserX size={13} className="group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-black uppercase tracking-tighter">Block</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                        <Users size={48} className="opacity-20 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">No staff found</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'logs' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Staff Member</th>
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Type</th>
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Role</th>
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Entry Time</th>
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Exit Time</th>
                          <th className="py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {staffData && staffData.filter(s => s.todayLog).length > 0 ? staffData.filter(s => s.todayLog).map((staff) => (
                          <tr key={staff._id} className={`transition-colors group ${staff.todayLog!.isOverstay ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase overflow-hidden border border-border">
                                  {staff.photo ? <img src={staff.photo} alt="" className="w-full h-full object-cover" /> : staff.staffName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{staff.staffName}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">Mob: {staff.mobileNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${staff.staffType === 'One-time' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                {staff.staffType}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-bold text-muted-foreground uppercase">{staff.role}</span>
                            </td>
                            <td className="py-4 px-4">
                                <span className="text-xs font-bold text-foreground/80">
                                  {new Date(staff.todayLog!.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                              {staff.todayLog!.exitTime ? (
                                <span className="text-xs font-bold text-foreground/80">
                                  {new Date(staff.todayLog!.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${staff.todayLog!.isOverstay ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10'}`}>Inside</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                               {staff.todayLog!.isOverstay ? (
                                 <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-destructive/10 text-destructive inline-flex items-center gap-1.5" title={`${staff.todayLog!.hoursInside} hrs inside, exit not marked`}>
                                   <ShieldAlert size={11} strokeWidth={3} /> Overstay {staff.todayLog!.hoursInside}h
                                 </span>
                               ) : (
                                 <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${staff.todayLog!.exitTime ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success'}`}>
                                   {staff.todayLog!.exitTime ? 'Completed' : 'Working'}
                                 </span>
                               )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="py-20 text-center text-muted-foreground/30 uppercase text-xs font-bold tracking-widest">No movement today</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {blockedStaff && blockedStaff.length > 0 ? blockedStaff.map((staff) => (
                      <div key={staff._id} className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold border border-destructive/20">
                            {staff.staffName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground leading-tight">{staff.staffName}</h4>
                            <p className="text-[11px] font-bold text-destructive uppercase tracking-widest">{staff.role}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted/50 rounded-xl border border-destructive/10">
                            <p className="text-[10px] font-black uppercase text-destructive/60 mb-1">Reason</p>
                            <p className="text-xs font-medium text-foreground/70 italic">"{staff.blockedReason}"</p>
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => handleUnblock(staff._id)}
                              className="w-full bg-card hover:bg-success hover:text-success-foreground text-success px-4 py-2.5 rounded-xl text-xs font-bold border border-success/20 transition-all shadow-sm active:scale-95"
                            >
                              Unblock Staff
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                        <ShieldCheck size={48} className="opacity-20 mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">No blocked records</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : mainTab === 'delivery' ? (
          /* Delivery Management Section */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard 
                title="Active Deliveries" 
                value={(deliveryData || []).filter(d => !d.exitTime).length} 
                icon={Truck} 
                color="bg-blue-50 text-blue-600"
                onClick={() => setDeliveryTab('active')}
              />
              <StatsCard 
                title="Total Today" 
                value={deliveryData?.length || 0} 
                icon={History} 
                color="bg-emerald-50 text-emerald-600"
                onClick={() => setDeliveryTab('history')}
              />
              <div
                onClick={() => setShowDeliveryModal(true)}
                className="bg-blue-600 p-5 rounded-2xl shadow-none flex items-center justify-center gap-3 cursor-pointer hover:bg-blue-700 transition-all active:scale-95"
              >
                <Plus className="text-white" size={24} />
                <span className="text-white font-bold">New Delivery Entry</span>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden min-h-[600px]">
              <div className="border-b border-border p-2 flex items-center justify-between bg-muted/50/50">
                <div className="flex gap-1">
                  {[
                    { id: 'active', label: 'In Society', icon: Clock },
                    { id: 'history', label: 'History Logs', icon: History },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDeliveryTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        deliveryTab === tab.id 
                        ? "bg-card text-blue-600 shadow-sm border border-border" 
                        : "text-muted-foreground hover:text-slate-700"
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {deliveryLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Deliveries...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Delivery Boy</th>
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Company</th>
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Flat</th>
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Entry</th>
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Exit</th>
                          <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(deliveryTab === 'active' 
                          ? (deliveryData || []).filter(d => !d.exitTime)
                          : (deliveryData || [])
                        ).map((del) => (
                          <tr key={del._id} className="hover:bg-muted/50/50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{del.deliveryBoyName}</span>
                                <span className="text-[10px] text-muted-foreground">Mob: {del.mobileNumber}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">{del.companyName}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-bold text-slate-600">{del.flatNumber}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-bold text-muted-foreground">{new Date(del.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="py-4 px-4">
                              {del.exitTime ? (
                                <span className="text-xs font-bold text-muted-foreground">{new Date(del.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Inside</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {!del.exitTime && (
                                <button 
                                  onClick={() => handleDeliveryExit(del._id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-md shadow-rose-100 transition-all active:scale-95"
                                >
                                  Mark Exit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Visitor Management Section */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard 
                title="Pending Approvals" 
                value={(visitorData || []).filter((v: any) => v.status === 'Pending').length} 
                icon={ShieldAlert} 
                color="bg-amber-50 text-amber-600"
                onClick={() => setVisitorTab('pending')}
              />
              <StatsCard 
                title="Currently Inside" 
                value={(visitorData || []).filter((v: any) => v.status === 'Approved' && !v.exitTime).length} 
                icon={MapPin} 
                color="bg-blue-50 text-blue-600"
                onClick={() => setVisitorTab('inside')}
              />
              <StatsCard 
                title="Total Visitors Today" 
                value={visitorData?.length || 0} 
                icon={Users} 
                color="bg-emerald-50 text-emerald-600"
                onClick={() => setVisitorTab('history')}
              />
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden min-h-[600px]">
              <div className="border-b border-border p-2 flex items-center justify-between bg-muted/50/50">
                <div className="flex gap-1">
                  {[
                    { id: 'pending', label: 'Pending Request', icon: ShieldAlert },
                    { id: 'inside', label: 'Inside Society', icon: Clock },
                    { id: 'history', label: 'Visitor Logs', icon: History },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setVisitorTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        visitorTab === tab.id 
                        ? "bg-card text-blue-600 shadow-sm border border-border" 
                        : "text-muted-foreground hover:text-slate-700"
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* [POINT 3] Guard: bina bataye aaye visitor / technician */}
                <button
                  onClick={() => setShowGateModal(true)}
                  className={`flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 mr-1 ${!isGuard && !isAdmin ? 'hidden' : ''}`}
                >
                  <Camera size={14} strokeWidth={3} /> Gate Entry
                </button>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Visitor</th>
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Purpose</th>
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Flat</th>
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 text-center">Verification Code</th>
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Status</th>
                        <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(visitorTab === 'pending' 
                        ? (visitorData || []).filter((v: any) => v.status?.toLowerCase() === 'pending')
                        : visitorTab === 'inside'
                        ? (visitorData || []).filter((v: any) => v.status?.toLowerCase() === 'approved' && !v.exitTime)
                        : (visitorData || [])
                      ).map((v: any) => (
                        <tr key={v._id} className={`transition-colors ${v.isOverstay ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {/* [POINT 3] Gate par liya hua photo */}
                              {v.photo ? (
                                <img src={v.photo} alt="" className="w-9 h-9 rounded-lg object-cover border border-border shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase border border-border shrink-0">
                                  {v.visitorName?.charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-foreground truncate">{v.visitorName}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Mob: {v.visitorPhone}{v.vehicleNumber ? ' / ' + v.vehicleNumber : ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold text-muted-foreground">{v.purpose}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold text-slate-600">{v.flatNumber}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {v.requestType === 'gate_request' ? (
                              /* [POINT 3] Gate request me code nahi hota - resident app se approve karta hai */
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                Resident Approval
                              </span>
                            ) : v.status?.toLowerCase() === 'pending' ? (
                               <span className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-lg font-black text-sm tracking-widest border border-border shadow-sm">
                                 {v.verificationCode || '####'}
                               </span>
                            ) : (
                               <span className="text-slate-300 text-xs font-bold">Verified</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {v.isOverstay ? (
                              /* [POINT 3] Resident ke diye duration se zyada ruk gaya */
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-destructive/10 text-destructive inline-flex items-center gap-1.5"
                                    title={`Allowed ${v.allowedDurationMins} min`}>
                                <ShieldAlert size={11} strokeWidth={3} /> Overstay +{v.minsOverstayed}m
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                                v.status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600'
                                : v.status?.toLowerCase() === 'rejected' ? 'bg-destructive/10 text-destructive'
                                : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {v.status === 'Pending' && v.requestType === 'gate_request' ? 'Waiting' : v.status}
                              </span>
                            )}
                            {v.status === 'Approved' && v.allowedDurationMins && !v.exitTime && (
                              <span className="block text-[9px] font-bold text-muted-foreground mt-1">
                                Allowed {v.allowedDurationMins} min
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {v.status?.toLowerCase() === 'pending' && v.requestType === 'gate_request' ? (
                              /* [POINT 3] Resident ke jawab ka intezaar - guard yahan kuch nahi kar sakta */
                              <span className="text-[10px] font-bold text-amber-600 uppercase inline-flex items-center gap-1.5">
                                <Timer size={12} strokeWidth={3} /> Waiting for resident
                              </span>
                            ) : v.status?.toLowerCase() === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setShowVerifyModal(v)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-md shadow-blue-100 transition-all active:scale-95"
                                >
                                  Approve Entry
                                </button>
                                <button 
                                  onClick={() => handleRejectVisitor(v._id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (v.status?.toLowerCase() === 'approved' && !v.exitTime) ? (
                              <button 
                                onClick={() => handleVisitorExit(v._id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-md shadow-rose-100 transition-all active:scale-95"
                              >
                                Mark Exit
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* [POINT 3] Gate Entry Modal - surprise visitor / technician */}
      {showGateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowGateModal(false)} />
          <div className="relative bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-border">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">Gate Entry</h3>
                  <p className="text-xs text-muted-foreground mt-1">Resident ko approval request jayegi</p>
                </div>
              </div>
              <button onClick={() => setShowGateModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Photo</label>
                <div className="mt-1.5 flex items-center gap-3">
                  {gateVisitor.photo ? (
                    <img src={URL.createObjectURL(gateVisitor.photo)} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <Camera size={18} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setGateVisitor({ ...gateVisitor, photo: e.target.files?.[0] || null })}
                    className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-border file:text-xs file:font-bold file:bg-muted file:text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visitor Name *</label>
                <input className={inputCls + " mt-1.5"} value={gateVisitor.visitorName}
                  onChange={(e) => setGateVisitor({ ...gateVisitor, visitorName: e.target.value })}
                  placeholder="Ramesh Kumar" />
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mobile Number *</label>
                <input className={inputCls + " mt-1.5"} value={gateVisitor.visitorPhone}
                  onChange={(e) => setGateVisitor({ ...gateVisitor, visitorPhone: e.target.value })}
                  placeholder="9876543210" />
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Purpose *</label>
                <input className={inputCls + " mt-1.5"} value={gateVisitor.purpose}
                  onChange={(e) => setGateVisitor({ ...gateVisitor, purpose: e.target.value })}
                  placeholder="Plumbing / Electrician / Guest" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Flat Number *</label>
                  <input className={inputCls + " mt-1.5"} value={gateVisitor.flatNumber}
                    onChange={(e) => setGateVisitor({ ...gateVisitor, flatNumber: e.target.value })}
                    placeholder="A-402" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vehicle</label>
                  <input className={inputCls + " mt-1.5"} value={gateVisitor.vehicleNumber}
                    onChange={(e) => setGateVisitor({ ...gateVisitor, vehicleNumber: e.target.value })}
                    placeholder="DL-01-AB-1234" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border">
              <button
                onClick={handleGateEntry}
                disabled={gateSubmitting}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {gateSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Send Request to Resident</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time Staff Entry Modal */}
      {showOneTimeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOneTimeModal(false)} />
          <div className="relative bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">One-time Entry</h3>
                  <p className="text-xs text-muted-foreground mt-1">Register temporary worker entry</p>
                </div>
              </div>
              <button onClick={() => setShowOneTimeModal(false)} className="p-2 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleOneTimeEntry}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Staff Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Plumber" 
                    className={inputCls} 
                    value={oneTimeStaff.staffName}
                    onChange={(e) => setOneTimeStaff({...oneTimeStaff, staffName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. 9876543210" 
                    className={inputCls} 
                    value={oneTimeStaff.mobileNumber}
                    onChange={(e) => setOneTimeStaff({...oneTimeStaff, mobileNumber: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Upload Photo (Optional)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="one-time-photo"
                      onChange={(e) => setOneTimeStaff({...oneTimeStaff, photo: e.target.files ? e.target.files[0] : null})}
                    />
                    <label htmlFor="one-time-photo" className="flex-1 p-4 bg-muted/50 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                      <Plus size={20} className="text-muted-foreground group-hover:text-emerald-500" />
                      <span className="text-[10px] font-bold text-muted-foreground group-hover:text-emerald-600 uppercase">
                        {oneTimeStaff.photo ? oneTimeStaff.photo.name : "Click to Upload Photo"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/50/80 border-t border-border flex items-center gap-3">
                <button type="button" onClick={() => setShowOneTimeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all active:scale-95">Mark Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Verification Confirmation Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowVerifyModal(null)} />
          <div className="relative bg-card rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Verify Visitor Code</h3>
              <p className="text-sm text-muted-foreground mt-2">Does the visitor's code match?</p>
              
              <div className="mt-8 space-y-6">
                <div className="space-y-1.5 text-left">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Enter Visitor's 4-Digit Code</label>
                   <input 
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 1234"
                    className={`${inputCls} text-center text-2xl font-black tracking-[8px] py-4`}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                   />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    disabled={isVerifying}
                    className="w-full py-4 rounded-2xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                    onClick={() => handleApproveVisitor(showVerifyModal._id)}
                  >
                    {isVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" /> Verifying...
                      </span>
                    ) : "Verify & Approve Entry"}
                  </button>
                  <button 
                    onClick={() => {
                      setShowVerifyModal(null);
                      setEnteredCode("");
                    }}
                    className="text-muted-foreground font-bold text-xs hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Entry Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeliveryModal(false)} />
          <div className="relative bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">New Delivery Entry</h3>
                  <p className="text-xs text-muted-foreground mt-1">Record incoming package/delivery</p>
                </div>
              </div>
              <button onClick={() => setShowDeliveryModal(false)} className="p-2 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Delivery Boy Name</label>
                    <input 
                      type="text" required
                      className={inputCls} 
                      value={newDelivery.deliveryBoyName}
                      onChange={(e) => setNewDelivery({...newDelivery, deliveryBoyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Company</label>
                    <div className="relative" ref={companyDropdownRef}>
                      <div 
                        onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                        className={`min-h-[42px] w-full bg-muted/50 border ${isCompanyDropdownOpen ? 'border-blue-400 ring-2 ring-blue-50 bg-card' : 'border-border'} rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer transition-all hover:bg-card hover:border-blue-300 group`}
                      >
                        <span className={`text-sm ${newDelivery.companyName ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                          {newDelivery.companyName || "Select Company"}
                        </span>
                        <ChevronDown size={16} className={`text-muted-foreground group-hover:text-blue-500 transition-transform duration-200 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isCompanyDropdownOpen && (
                        <div className="absolute z-[150] w-full mt-2 bg-card border border-border rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto p-1.5">
                            {deliveryCompanies.map((company) => {
                              const isSelected = newDelivery.companyName === company;
                              return (
                                <div
                                  key={company}
                                  onClick={() => {
                                    setNewDelivery({...newDelivery, companyName: company});
                                    setIsCompanyDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-muted/50 text-slate-600'
                                  }`}
                                >
                                  <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{company}</span>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
                                      <Check size={12} className="text-white" strokeWidth={4} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mobile Number</label>
                    <input 
                      type="tel" required
                      className={inputCls} 
                      value={newDelivery.mobileNumber}
                      onChange={(e) => setNewDelivery({...newDelivery, mobileNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Flat Number</label>
                    <input 
                      type="text" required
                      className={inputCls} 
                      value={newDelivery.flatNumber}
                      onChange={(e) => setNewDelivery({...newDelivery, flatNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Vehicle Number (Optional)</label>
                  <input 
                    type="text"
                    className={inputCls} 
                    value={newDelivery.vehicleNumber}
                    onChange={(e) => setNewDelivery({...newDelivery, vehicleNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 bg-muted/50/80 border-t border-border flex items-center gap-3">
                <button type="button" onClick={() => setShowDeliveryModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHistoryModal(null)} />
          <div className="relative bg-card rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100">
                  {showHistoryModal.staffName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{showHistoryModal.staffName}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{showHistoryModal.role} • {flatsLabel(showHistoryModal)}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="p-2 hover:bg-card rounded-xl text-muted-foreground transition-colors border border-transparent hover:border-border">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 h-[400px] overflow-y-auto">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fetching Logs...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Recent Attendance History</p>
                  {staffHistory && staffHistory.length > 0 ? staffHistory.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-card flex flex-col items-center justify-center border border-border shadow-sm group-hover:border-blue-100 transition-all">
                          <span className="text-[10px] font-bold text-blue-600 leading-none">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-lg font-black text-foreground leading-none mt-0.5">{new Date(log.date).getDate()}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <LogIn size={12} className="text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700">Entry: {new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LogOut size={12} className="text-rose-500" />
                            <span className="text-xs font-bold text-slate-700">Exit: {log.exitTime ? new Date(log.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Inside'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date</span>
                        <span className="px-3 py-1 bg-card border border-border rounded-lg text-[10px] font-bold text-slate-600 group-hover:border-blue-100 shadow-sm">
                          {log.date}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-40">
                       <Clock size={40} className="mx-auto mb-2" />
                       <p className="text-xs font-bold uppercase">No history found</p>
                    </div>
                  )}
                  
                  <div className="py-8 flex flex-col items-center justify-center text-muted-foreground opacity-40">
                    <div className="w-px h-8 bg-slate-200 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">End of History</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted/50/50 flex justify-end">
              <button 
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
              >
                Download Full Report <ArrowRightLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBlockModal(null)} />
          <div className="relative bg-card rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-foreground text-lg">Block Staff Member</h3>
              <p className="text-xs text-muted-foreground mt-1">Provide a reason to restrict entry for {showBlockModal.staffName}</p>
            </div>
            <div className="p-6">
              <textarea 
                placeholder="Enter reason for blocking (e.g. Behavioral issues, Expired ID)..."
                className={`${inputCls} min-h-[120px] resize-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400`}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <div className="p-6 bg-muted/50/80 border-t border-border flex gap-3 rounded-b-3xl">
              <button onClick={() => setShowBlockModal(null)} className="flex-1 py-2.5 font-bold text-slate-600 hover:bg-card rounded-xl transition-colors">Cancel</button>
              <button onClick={handleBlock} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95">Confirm Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground leading-none">Register New Staff</h3>
                  <p className="text-xs text-muted-foreground mt-1">Add a new daily help or staff member</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted/50 rounded-xl text-muted-foreground transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Priya Devi" 
                      className={inputCls} 
                      value={newStaff.staffName}
                      onChange={(e) => setNewStaff({...newStaff, staffName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 7701122334" 
                      className={inputCls} 
                      value={newStaff.mobileNumber}
                      onChange={(e) => setNewStaff({...newStaff, mobileNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Role / Category</label>
                    <div className="relative" ref={roleDropdownRef}>
                      <div 
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className={`min-h-[42px] w-full bg-muted/50 border ${isRoleDropdownOpen ? 'border-blue-400 ring-2 ring-blue-50 bg-card' : 'border-border'} rounded-xl px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-pointer transition-all hover:bg-card hover:border-blue-300 group`}
                      >
                        {newStaff.role.length === 0 ? (
                          <span className="text-sm text-muted-foreground ml-2">Select Roles</span>
                        ) : (
                          newStaff.role.map((r: string) => (
                            <div key={r} className="bg-blue-100 text-blue-700 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center gap-1 animate-in zoom-in-95 duration-150">
                              {r}
                              <X 
                                size={10} 
                                strokeWidth={3} 
                                className="hover:text-blue-900 cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRole(r);
                                }}
                              />
                            </div>
                          ))
                        )}
                        <div className="ml-auto pr-1 text-muted-foreground group-hover:text-blue-500 transition-colors">
                          <ChevronDown size={16} className={`transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {isRoleDropdownOpen && (
                        <div className="absolute z-[150] w-full mt-2 bg-card border border-border rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto p-1.5">
                            {roleOptions.map((option) => {
                              const isSelected = newStaff.role.includes(option);
                              return (
                                <div
                                  key={option}
                                  onClick={() => toggleRole(option)}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-muted/50 text-slate-600'
                                  }`}
                                >
                                  <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{option}</span>
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-card'
                                  }`}>
                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      Flats <span className="text-muted-foreground/60 normal-case tracking-normal font-bold">(kitne flats me kaam karta hai)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. C-302"
                        className={inputCls}
                        value={flatDraft}
                        onChange={(e) => setFlatDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFlat(); }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addFlat}
                        className="shrink-0 bg-muted hover:bg-primary/10 hover:text-primary border border-border text-muted-foreground px-3 rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    {newStaff.flatNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newStaff.flatNumbers.map((flat: string) => (
                          <span key={flat} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-lg border border-primary/20">
                            {flat}
                            <button type="button" onClick={() => removeFlat(flat)} className="hover:text-destructive transition-colors">
                              <X size={11} strokeWidth={3} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Vehicle Number (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DL3CAB1122" 
                    className={inputCls} 
                    value={newStaff.vehicleNumber}
                    onChange={(e) => setNewStaff({...newStaff, vehicleNumber: e.target.value})}
                  />
                </div>

                {/* Document Upload Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Aadhar Card (PDF/Image)</label>
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      className={`${inputCls} py-1.5`}
                      onChange={(e) => setNewStaff({...newStaff, aadharCard: e.target.files ? e.target.files[0] : null})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Police Verification</label>
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      className={`${inputCls} py-1.5`}
                      onChange={(e) => setNewStaff({...newStaff, policeVerification: e.target.files ? e.target.files[0] : null})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Staff Photo</label>
                   <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="staff-photo-main"
                      onChange={(e) => setNewStaff({...newStaff, photo: e.target.files ? e.target.files[0] : null})}
                    />
                    <label htmlFor="staff-photo-main" className="flex-1 p-6 bg-muted/50 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group">
                      <div className="w-12 h-12 bg-card rounded-2xl shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:scale-110 transition-all border border-border group-hover:border-blue-100">
                        <Plus size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-muted-foreground group-hover:text-blue-600 transition-colors">
                          {newStaff.photo ? newStaff.photo.name : "Upload Staff Photo"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">PNG, JPG or WEBP (Max 2MB)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/50/80 border-t border-border flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-card border border-transparent hover:border-border transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-none active:scale-95"
                >
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default DailyStaff;
