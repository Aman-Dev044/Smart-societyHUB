import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
   Menu, X, LogOut, User, Bell, Megaphone,
  LayoutDashboard, Users, CreditCard, FileText,
  Settings, MessageSquare, Shield, Building, UserX, Cog,
  Home, UserCheck, HardHat, ShieldCheck, Wrench, AlertOctagon, LucideFileText, Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { ModeToggle } from "../mode-toggle";
import { useAppDispatch, useAppSelector } from "@/store/store"; // [NEW] Import hooks
import { fetchUnreadCount } from "@/features/notificationSlice"; // [NEW] Import fetchUnreadCount
import { usePushNotifications } from "@/hooks/usePushNotifications"; // [FCM] Push register + foreground toasts
import { useLogout } from "@/hooks/useLogout"; // Shared logout (push cleanup + session clear)
 
interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string; // Made flexible to accept "admin" or others
}
 
const societyAdminNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Resident Directory", href: "/residentDirectory" },
  { icon: Building, label: "My Society", href: "/my-society" },
  { icon: Megaphone, label: "Notice Board", href: "/noticeBoard" },
  { icon: CreditCard, label: "Finances", href: "/finances" },
  { icon: Bell, label: "NotificationHub", href: "/notificationHub" },
  { icon: MessageSquare, label: "Complaints", href: "/complaintsDetail" },
  { icon: AlertOctagon, label: "Fine", href: "/addPenaltyFine" },
  { icon: Wrench, label: "Maintenance", href: "/maintenance" },
  {icon: UserCheck, label: "Daily Staff", href: "/daily-staff" },
  { icon: FileText, label: "Documents", href: "/society-admin/documents" },
  { icon: Ticket, label: "Support", href: "/society-admin/support" },
  { icon: UserX, label: "Deactivations", href: "/deactivationrequests" },
  { icon: Settings, label: "Settings", href: "/adminSettings" },
  ];


const navigationConfig: Record<string, any[]> = {
  "super-admin": [
    { icon: LayoutDashboard, label: "Dashboard", href: "/super-admin" },
    { icon: Building, label: "Societies", href: "/super-admin/globalSocietyDirectory" },
        // { icon: Users, label: "Society Admins", href: "/super-admin/admins" },

    { icon: CreditCard, label: "Payments", href: "/super-admin/globalPayments" },
    { icon: Bell, label: "Notifications", href: "/notificationHub" },
    { icon: Ticket, label: "Support Tickets", href: "/super-admin/support-tickets" },
    // { icon: LucideFileText, label: "Documents Center", href: "/super-admin/document-center" },
    { icon: Cog, label: "System Settings", href: "/systemSettings" },
    { icon: Settings, label: "Admin Settings", href: "/super-admin/settings" },
  ],
  "society-admin": societyAdminNav,
  "admin": societyAdminNav,
  "guard": [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Resident Directory", href: "/residentDirectory" },
    { icon: Megaphone, label: "Notice Board", href: "/noticeBoard" },
    { icon: Bell, label: "NotificationHub", href: "/notificationHub" },
    { icon: UserCheck, label: "Daily Staff", href: "/daily-staff" },
  ],
  "residential-admin": [
    { icon: LayoutDashboard, label: "Dashboard", href: "/residentialDashboard" },
    { icon: CreditCard, label: "Payments", href: "/residentialPayments/" },
    { icon: Bell, label: "Notifications", href: "/notificationHub" },
    { icon: UserCheck, label: "Notices", href: "/societyNotices" },
    { icon: ShieldCheck, label: "Support", href: "/residentialSupport" },
    { icon: HardHat, label: "Profile", href: "/profileHub" },
  ],
  "member": [
    { icon: LayoutDashboard, label: "Dashboard", href: "/member" },
    { icon: CreditCard, label: "My Payments", href: "/member/payments" },
    { icon: Bell, label: "Notifications", href: "/notificationHub" },
    { icon: Megaphone, label: "Notices", href: "/member/notices" },
    { icon: FileText, label: "Documents", href: "/member/documents" },
    { icon: Users, label: "Staff Directory", href: "/member/staff-directory" },
    { icon: User, label: "Profile", href: "/member/profile" },
  ],
};
 
const societyAdminNavbarLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resident Directory", href: "/residentDirectory" },
  { label: "Billing", href: "/finances" },
  { label: "Complaints", href: "/complaintsDetail" },
  { label: "Notices", href: "/noticeBoard" },
];
 
const roleLabels: Record<string, string> = {
  "super-admin": "Super Admin",
  "superadmin": "Super Admin",
  "society-admin": "Society Admin",
  "society_admin": "Society Admin",
  "admin": "Society Admin",
  "residential-admin": "Residential Admin",
  "member": "Member",
  "user": "Member",
  "guard": "Security Guard",
};
 
export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // [NEW] Use app dispatch
  const { unreadCount } = useAppSelector((state) => state.notifications); // [NEW] Get unread count
  
  useEffect(() => {
    dispatch(fetchUnreadCount()); // [NEW] Fetch unread count on mount
  }, [dispatch]);

  // [FCM] Ye layout har logged-in page ko wrap karti hai, isliye push setup
  // yahan ek jagah hota hai — har role, har page ke liye.
  usePushNotifications();

  const rawRole = (role || "guard").toLowerCase();
  
  // Role Normalization Logic
  let resolvedRole = rawRole;
  if (rawRole === "society_admin" || rawRole === "admin") resolvedRole = "society-admin";
  if (rawRole === "superadmin") resolvedRole = "super-admin";
  if (rawRole === "user") resolvedRole = "member";

  const navigation = navigationConfig[resolvedRole] || societyAdminNav;
 
  // Simplified logic for UI components
  const isSuperAdmin = resolvedRole === "super-admin";
  const isSocietyAdmin = resolvedRole === "society-admin" || rawRole === "guard";
  const isResidentialAdmin = resolvedRole === "residential-admin";
  const isMember = resolvedRole === "member";
  const isSocietyOrResidential = isSocietyAdmin || isResidentialAdmin;
 
  // Logout ka pura logic useLogout me hai (push token cleanup + session clear),
  // taaki ProfileHub aur yahan ek hi behaviour rahe.
  const handleLogout = useLogout();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 1. SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[100] w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isSocietyAdmin && "mt-16 lg:mt-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building className="text-primary-foreground w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">SocietySmartHub</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
 
          <div className="px-6 py-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
              <Shield size={12} /> {roleLabels[rawRole] || "User"}
            </span>
          </div>
 
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative",
                    isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {item.label}
                  {(item.label === "NotificationHub" || item.label === "Notifications") && unreadCount > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-card">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
 
          <div className="p-4 border-t border-border bg-muted/50">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm font-semibold text-destructive">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>
 
      {/* 2. TOP HEADER */}
      {isSocietyOrResidential ? (
        <header className="fixed top-0 left-0 right-0 z-[80] bg-background border-b border-border h-16 lg:h-20 shadow-sm">
          <nav className="h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg text-foreground transition-all">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground hidden md:block">SocietySmartHub</span>
              </div>
            </div>
 
            {resolvedRole === "society-admin" && (
              <div className="hidden lg:flex items-center gap-1">
                {societyAdminNavbarLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link key={link.href} to={link.href} className={cn("px-4 py-2 text-sm font-semibold relative", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                      {link.label}
                      {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            )}
 
            <div className="flex items-center gap-4">
              <ModeToggle />
              <button 
                onClick={() => navigate("/notificationHub")}
                className="p-2 text-muted-foreground relative hover:text-foreground transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground leading-none">Admin User</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Head Secretary</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                </div>
              </div>
            </div>
          </nav>
        </header>
      ) : (
        <header className={cn(
          "sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <ModeToggle />
              <button 
                onClick={() => navigate("/notificationHub")}
                className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-card">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md"><User className="w-4 h-4" /></div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[rawRole] || "User"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
 
      {/* 3. MAIN CONTENT AREA */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "lg:pl-64" : "pl-0"
      )}>
        <main className={cn(
          "p-4 lg:p-8 min-h-screen",
          isSocietyOrResidential ? "pt-24 lg:pt-32" : "pt-20 lg:pt-8"
        )}>
          {children}
        </main>
      </div>
 
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
} 
