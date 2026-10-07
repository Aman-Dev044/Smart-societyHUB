import React, { useEffect, useState } from 'react';
import { 
  UserCircle, 
  ChevronRight, 
  User, 
  Lock, 
  Bell, 
  Mail, 
  Languages, 
  HelpCircle, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft,
  Camera,
  Smartphone,
  Building2,
  Settings,
  Info,
  Sun,
  Moon,
  Phone,
  Edit2,
  EyeOff,
  Eye
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppDispatch, RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { changeMyPassword, getMyProfile, updateMyProfile } from '@/features/User/userSlice';
import { toast } from '@/hooks/use-toast';
import { useLogout } from '@/hooks/useLogout';


const ProfileHub = () => {

  const [currentView, setCurrentView] = useState('hub');
  const dispatch = useDispatch<AppDispatch>();
  const handleLogout = useLogout();

  const { profileData, loading } = useSelector((state: RootState) => state.user);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (currentView === "hub") {
      dispatch(getMyProfile());
    }
  }, [currentView, dispatch]);
  
  // User Data State
  const userData = profileData || {};

  // Temporary state for the edit form
  const [formData, setFormData] = useState({ ...userData });

  const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Allow only images
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }

  // Preview instantly
  const previewURL = URL.createObjectURL(file);

  setFormData((prev) => ({
    ...prev,
    avatar: previewURL,
    avatarFile: file 
  }));
};

  // --- Handlers ---


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = "Full name is required";
  }

  if (!formData.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    newErrors.email = "Invalid email format";
  }

  if (!formData.phone.trim()) {
    newErrors.phone = "Phone number is required";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  try {
    const form = new FormData();

    if (formData.name !== profileData?.name) {
      form.append("name", formData.name);
    }

    if (formData.email !== profileData?.email) {
      form.append("email", formData.email);
    }

    if (formData.phone !== profileData?.phone) {
      form.append("phone", formData.phone);
    }

    if (formData.profileImage) {
      form.append("avatar", formData.profileImage);
    }

    // prevent empty update
    if ([...form.entries()].length === 0) {
      toast({
        title: "No changes detected",
        description: "Update something before saving."
      });
      return;
    }

    await dispatch(updateMyProfile(form)).unwrap();

    setCurrentView("hub");

    toast({
      title: "Profile Updated Successfully",
      description: "Profile data updated successfully"
    });

  } catch (error: any) {
    console.error("Update failed:", error);

    toast({
      title: "Failed to Update",
      description: error?.message || "Failed to update profile data.",
      variant: "destructive",
    });
  }
};


const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors: Record<string, string> = {};

  if (!securityData.currentPassword.trim()) {
    errors.currentPassword = "Current password is required";
  }

  if (!securityData.newPassword) {
    errors.newPassword = "New password is required";
  } else if (securityData.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  }

  if (!securityData.confirmPassword) {
    errors.confirmPassword = "Please confirm password";
  } else if (securityData.newPassword !== securityData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // If validation errors exist
  if (Object.keys(errors).length > 0) {
    setSecurityErrors(errors);

    // Show first error in toast
    const firstError = Object.values(errors)[0];

    toast({
      title: "Validation Error",
      description: firstError,
      variant: "destructive",
    });

    return;
  }

  try {
    await dispatch(changeMyPassword({
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword,
    })).unwrap();

    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });

    setSecurityData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setSecurityErrors({});
    setShowPasswordSection(false);

  } catch (error: any) {
    toast({
      title: "Update Failed",
      description: error || "Something went wrong",
      variant: "destructive",
    });
  }
};

  // --- UI Components ---

  const SettingsRow = ({ icon: Icon, label, value, onClick }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
          <Icon size={20} />
        </div>
        <span className="font-semibold text-[15px] text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-muted-foreground font-medium">{value}</span>}
        <ChevronRight size={18} className="text-slate-300 group-hover:text-muted-foreground transition-colors" />
      </div>
    </button>
  );

  const SectionHeader = ({ title }) => (
    <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 mt-6 first:mt-2 px-2">
      {title}
    </h3>
  );

  return (
    <DashboardLayout role='member'>
    <div className="min-h-screen flex flex-col text-foreground ">
      
      {/* --- Main Content --- */}
<main className="w-full max-w-5xl mx-auto space-y-5">        
        {currentView === 'hub' && (
          <div className="w-full max-w-4xl rounded-[2.5rem] shadow-xl shadow-slate-200/40 border bg-card border-border overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Profile Info Header */}
            {loading ? (
              <div className="p-10 text-center flex flex-col items-center border-b border-border animate-pulse">

                <div className="w-32 h-32 rounded-full bg-muted mb-4"></div>

                <div className="h-6 w-48 bg-muted rounded mb-2"></div>

                <div className="h-4 w-32 bg-muted rounded"></div>

              </div>
            ) : (
            <div className="p-10 text-center flex flex-col items-center border-b border-border">
              <div className="relative group mb-4">
                <img
                    src={
                      profileData?.avatar ||
                      `https://ui-avatars.com/api/?name=${profileData?.name || "User"}&background=3B82F6&color=fff&size=150`
                    }
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover ring-8 ring-muted/20"
                  />
                <button 
                  onClick={() => {
                    if (profileData) {
                      setFormData({
                        name: profileData.name || "",
                        email: profileData.email || "",
                        phone: profileData.phone || "",
                        apartment: profileData.apartment || "",
                        avatar: profileData.avatar || "",
                      });
                    }
                    setErrors({});
                    setCurrentView("edit");
                  }}
                  className="absolute bottom-1 right-1 bg-[#3B82F6] text-white p-2.5 rounded-full shadow-lg "
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <h2 className="text-3xl font-semibold uppercase text-foreground grid md:flex items-center gap-4 md:gap-2">
                {userData?.name || "N/A"}
                <span className="text-xs px-4 py-1 -mb-2  uppercase tracking-widest bg-blue-100 text-[#2563EB] rounded-full font-bold">
                  {userData?.role || "N/A"}
                </span>
                <span
                  className={`text-xs px-4 py-1 -mb-2 uppercase tracking-widest rounded-full font-bold ${
                    profileData?.kyc?.verified
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {profileData?.kyc?.verified ? "KYC Verified" : "KYC Pending"}
                </span>
              </h2>
              <p className="text-muted-foreground mt-4 md:mt-1 font-semibold text-sm">Block {userData?.unit?.towerBlock || "N/A"} - {userData?.unit?.flatNumber || "N/A"}</p>
            </div>)}

            {/* List Sections */}
            <div className="px-8 py-6">
              <SectionHeader title="Account" />
              <div className="space-y-1">
                <SettingsRow icon={User} label="Personal Info" onClick={() => {
                      if (profileData) {
                        setFormData({
                          name: profileData.name || "",
                          email: profileData.email || "",
                          phone: profileData.phone || "",
                          apartment: profileData.apartment || "",
                          avatar: profileData.avatar || "",
                        });
                      }
                      setErrors({});
                      setCurrentView("edit");
                    }}
                   value={undefined} />
                <div className='h-[1px] bg-border'></div>
                <SettingsRow icon={Lock} label="Change Password" onClick={() => setCurrentView("chnagePassword")} value={undefined} />
              </div>

              <SectionHeader title="Notifications" />
              <div className="space-y-1">
                <SettingsRow icon={Bell} label="Push Notifications" value={undefined} onClick={undefined} />
                <div className='h-[1px] bg-border'></div>
                <SettingsRow icon={Mail} label="Email Notifications" value={undefined} onClick={undefined} />
              </div>

              <SectionHeader title="Preferences" />
              <div className="space-y-1">
                <SettingsRow icon={Languages} label="Language" value="English" onClick={undefined} />
              </div>

              <SectionHeader title="Support" />
              <div className="space-y-1">
                <SettingsRow icon={HelpCircle} label="Help Center" value={undefined} onClick={undefined} />
                <div className='h-[1px] bg-border'></div>
                <SettingsRow icon={ShieldCheck} label="Privacy Policy" value={undefined} onClick={undefined} />
              </div>

              <div className="pt-10 pb-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] font-black hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
                <p className="text-[11px] text-center text-[#94A3B8] mt-8 font-medium">Society App v2.4.0</p>
              </div>
            </div>
          </div>
        )}

        {/* --- View: Edit Profile (Image 8) --- */}
        {currentView === 'edit' && (
          <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between w-full mb-8 px-2">
              <button 
                onClick={() => setCurrentView('hub')}
                className="flex items-center gap-3 font-bold group"
              >
                <ArrowLeft size={20} className="text-slate-600 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xl">Edit Profile</span>
              </button>
            </div>

            <div className="rounded-[2.5rem] shadow-xl shadow-slate-200/40 border bg-card border-border p-8 md:p-12">
              {/* Photo Change Section */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative border-2 border-blue-100 rounded-[20rem] p-1">

                    <img
                      src={
                        profileData?.avatar ||
                        `https://ui-avatars.com/api/?name=${profileData?.name || "User"}&background=3B82F6&color=fff&size=150`
                      }
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover ring-8 ring-slate-50"
                    />

                    {/* Hidden File Input */}
                    <input
                    type="file"
                    accept="image/png, image/jpeg"
                    id="avatarInput"
                    className="hidden"
                    onChange={handleAvatarChange}
                    />

                    {/* Camera Button */}
                    <label
                    htmlFor="avatarInput"
                    className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer shadow-md hover:scale-105 transition"
                    >
                    <Camera size={18} />
                    </label>

                </div>

                {/* Also Trigger Upload */}
                {/* <label
                    htmlFor="avatarInput"
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline tracking-tight cursor-pointer"
                >
                    Change Profile Photo
                </label> */}
                </div>

              {/* Form Fields */}
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-2.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] fill-current" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Alex Morgan"
                      className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                        errors.name
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[#E2E8F0] focus:ring-blue-500/10"
                      }`}
                    />

                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-2.5 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white fill-[#94A3B8] " size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="alex.morgan@society.com"
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                          errors.email
                            ? "border-red-400 focus:ring-red-200"
                            : "border-[#E2E8F0] focus:ring-blue-500/10"
                        }`}
                      />

                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-2.5 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-transparent fill-[#94A3B8]" size={18} />
                      <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 019-2834"
                          className={`w-full pl-12 pr-4 py-4 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                            errors.phone
                              ? "border-red-400 focus:ring-red-200"
                              : "border-[#E2E8F0] focus:ring-blue-500/10"
                          }`}
                        />

                       
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-2.5 ml-1">Apartment No.</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                    <div 
                    
                      className="w-full pl-12 pr-4 py-4 border rounded-2xl cursor-not-allowed font-medium bg-[#F8FAFC] border-[#E2E8F0] text-muted-foreground"
                    >
                      <p>Block {userData?.unit?.towerBlock || "N/A"} - {userData?.unit?.flatNumber || "N/A"}</p>
                      </div>
                  </div>
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground mt-4 ml-1">
                    <Info size={14} className="text-muted-foreground" />
                    Contact your admin to change building allocation.
                  </p>
                </div>

                <div className="pt-10 space-y-4 flex flex-col justify-center items-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full max-w-lg py-4 rounded-2xl font-semibold tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-[#1D7FF0] hover:bg-blue-700 shadow-blue-600/30"
                    } text-white`}
                  >
                    {loading && (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCurrentView('hub')}
                    className="w-full py-2 text-muted-foreground font-bold text-sm hover:text-slate-600 transition-colors"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              </form>
            </div>
            
            <footer className="mt-12 mb-8 text-center space-y-4">
              <p className="text-xs font-medium text-[#94A3B8] tracking-[0.2em]">EcoSociety App v2.4.0</p>
              <div className="flex items-center justify-center gap-6 text-xs font-bold text-[#64748B]">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
              </div>
            </footer>
          </div>
        )}

          {currentView === "chnagePassword" && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="flex justify-center">
            <div className="bg-card w-full max-w-3xl p-8  rounded-3xl shadow-sm border border-border">
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 text-[#1D6AEE] rounded-full">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-semibold text-lg tracking-normal">
                  Password Management
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">

                  <div>
                  <label className="text-xs uppercase font-bold text-[#64748B] tracking-wider">
                    Current Password
                  </label>

                  <div className="relative ">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) =>
                        setSecurityData(prev => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                     placeholder='Enter your Current Password'
                      className={`w-full pl-4 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                        securityErrors.currentPassword
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[#E2E8F0] focus:ring-blue-500/10"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div></div>
                  
                  <div>
                    <label className="text-xs uppercase font-bold text-[#64748B] tracking-wider">
                      New Password
                    </label>

                    <div className="relative ">
                      <input
                        type={showNew ? "text" : "password"}
                        value={securityData.newPassword}
                        onChange={(e) =>
                          setSecurityData(prev => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder='Enter your New Password'
                        className={`w-full pl-4 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                        securityErrors.newPassword
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[#E2E8F0] focus:ring-blue-500/10"
                      }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase font-bold text-[#64748B] tracking-wider">
                      Confirm Password
                    </label>

                    <div className="relative ">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) =>
                          setSecurityData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder='Confirm Password'
                        className={`w-full pl-4 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium bg-[#F8FAFC] text-slate-700 ${
                        securityErrors.confirmPassword
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[#E2E8F0] focus:ring-blue-500/10"
                      }`}
                        
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                  </div>

                </div>

                {/* Submit */}
                <div className='grid md:flex justify-evenly'>
                <button
                  type="button"
                  onClick={() => setCurrentView('hub')}
                  className="mt-6 px-6 py-3 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-6 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-[#1D7FF0] hover:bg-blue-700"
                  } text-white`}
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {loading ? "Updating..." : "Update Password"}
                </button>
              
                </div>

              </div>
            </div>
            </div>
          </form>
        )}

      </main>
    </div>
    </DashboardLayout>
  );
};

export default ProfileHub;