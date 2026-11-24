import React, { useState, useEffect } from "react";
import { 
  User, Settings, ShieldCheck, Globe, KeyRound, AlertTriangle, 
  Trash2, CreditCard, BellRing, Eye, EyeOff, Save, Check, LogOut, 
  Info, Database, RefreshCw, Layers, Award, Radio, Link2, Bell, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileTabProps {
  user: any;
  onUpdateUser: (updated: any) => void;
  onLogout: () => void;
  onAddNotification: (notif: any) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

type ProfileSection = 
  | "personal" 
  | "preferences" 
  | "bookings" 
  | "wallet" 
  | "rewards" 
  | "privacy" 
  | "security" 
  | "notifications" 
  | "connected" 
  | "delete";

export default function ProfileTab({
  user,
  onUpdateUser,
  onLogout,
  onAddNotification,
  isDarkMode,
  setIsDarkMode
}: ProfileTabProps) {
  const isGuest = user?.isGuest;

  // Active section inside Profile settings
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal");

  // Input states
  const [name, setName] = useState(isGuest ? "Guest User" : (user?.name || "Anonymous Traveler"));
  const [email, setEmail] = useState(isGuest ? "" : (user?.email || ""));
  const [phone, setPhone] = useState(isGuest ? "" : "+91 98765 43210");
  const [currency, setCurrency] = useState("INR");
  const [lang, setLang] = useState("en");
  const [budgetLimit, setBudgetLimit] = useState(25000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings Toggles - Fully Functional & Persistent
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem("travelai_setting_biometric") === "true";
  });
  const [scamHeatmapEnabled, setScamHeatmapEnabled] = useState(() => {
    return localStorage.getItem("travelai_setting_scam_heatmap") === "true";
  });
  const [secureAuditLogEnabled, setSecureAuditLogEnabled] = useState(() => {
    return localStorage.getItem("travelai_setting_secure_audit") === "true";
  });
  const [marketingNotifications, setMarketingNotifications] = useState(() => {
    return localStorage.getItem("travelai_setting_marketing_notif") !== "false";
  });

  // Password confirmation state for Delete Account
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Synced state on load
  useEffect(() => {
    if (user && !isGuest) {
      setName(user.name || "Anonymous Traveler");
      setEmail(user.email || "");
    }
  }, [user, isGuest]);

  // Persistent toggle handlers with dynamic notifications
  const handleToggleBiometric = () => {
    const nextVal = !biometricEnabled;
    setBiometricEnabled(nextVal);
    localStorage.setItem("travelai_setting_biometric", String(nextVal));
    
    onAddNotification({
      id: "n_set_bio_" + Date.now(),
      title: "Biometric Policy Updated",
      text: `Biometric device authentication has been ${nextVal ? "enabled" : "disabled"} successfully.`,
      time: "Just now",
      read: false
    });
  };

  const handleToggleScamHeatmap = () => {
    const nextVal = !scamHeatmapEnabled;
    setScamHeatmapEnabled(nextVal);
    localStorage.setItem("travelai_setting_scam_heatmap", String(nextVal));
    
    onAddNotification({
      id: "n_set_scam_" + Date.now(),
      title: "Scam Overlay Status Changed",
      text: `Live scam heatmap layer is now ${nextVal ? "active" : "inactive"} across generated maps.`,
      time: "Just now",
      read: false
    });
  };

  const handleToggleSecureAudit = () => {
    const nextVal = !secureAuditLogEnabled;
    setSecureAuditLogEnabled(nextVal);
    localStorage.setItem("travelai_setting_secure_audit", String(nextVal));
    
    onAddNotification({
      id: "n_set_audit_" + Date.now(),
      title: "Secure Logging Modified",
      text: `Device sign-in audit logging has been ${nextVal ? "activated" : "deactivated"}.`,
      time: "Just now",
      read: false
    });
  };

  const handleToggleMarketing = () => {
    const nextVal = !marketingNotifications;
    setMarketingNotifications(nextVal);
    localStorage.setItem("travelai_setting_marketing_notif", String(nextVal));

    onAddNotification({
      id: "n_set_mkt_" + Date.now(),
      title: "Notification Flow Altered",
      text: `Marketing and deal notifications set to ${nextVal ? "active" : "muted"}.`,
      time: "Just now",
      read: false
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    
    setSavedSuccess(true);
    onUpdateUser({ name, email });
    
    onAddNotification({
      id: "n_prof_update_" + Date.now(),
      title: "Profile Preferences Synced",
      text: "Account parameters and secure metadata updated successfully on this node.",
      time: "Just now",
      read: false
    });

    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      // Guest can terminate session instantly
      setIsDeleting(true);
      setTimeout(() => {
        onLogout();
      }, 1000);
      return;
    }

    if (deleteConfirmPassword !== "DELETE") {
      setDeleteError("Invalid credentials. Type 'DELETE' in uppercase to confirm account closure.");
      return;
    }

    setDeleteError("");
    setIsDeleting(true);

    setTimeout(() => {
      onAddNotification({
        id: "n_delete_" + Date.now(),
        title: "Account Closing Pending",
        text: "Secure deletion protocols dispatched. Access token terminated.",
        time: "Just now",
        read: false
      });
      onLogout();
    }, 1500);
  };

  const sidebarItems: { id: ProfileSection; label: string; icon: any }[] = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "preferences", label: "Travel Preferences", icon: Settings },
    { id: "bookings", label: "Bookings", icon: Layers },
    { id: "wallet", label: "Wallet Hub", icon: CreditCard },
    { id: "rewards", label: "Elite Rewards", icon: Award },
    { id: "privacy", label: "Privacy Policies", icon: Globe },
    { id: "security", label: "Security & Protocols", icon: ShieldCheck },
    { id: "notifications", label: "Notifications Control", icon: Bell },
    { id: "connected", label: "Connected Accounts", icon: Link2 },
    { id: "delete", label: "Delete Account", icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left animate-fade-in pb-12">
      
      {/* 1. GUEST BANNER STATE */}
      {isGuest && (
        <div className="lg:col-span-12 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-zinc-800 dark:text-zinc-200 shrink-0">
              <Info className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wide">Guest Session Active</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                You are executing operations inside a transient guest profile (**Guest User**). Sign in now to sync secure travel documents, unlock premium itineraries, and link cloud payment nodes.
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 h-9 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs rounded-md transition-colors shrink-0 cursor-pointer"
          >
            Authenticate Terminal
          </button>
        </div>
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <div className="lg:col-span-3 bg-zinc-50/55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-2 space-y-1">
        <p className="px-3 py-2 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-900/60 mb-2">
          Profile Settings OS
        </p>
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar gap-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isDanger = item.id === "delete";
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-colors duration-150 shrink-0 cursor-pointer text-left ${
                  activeSection === item.id
                    ? isDanger 
                      ? "bg-rose-500 text-white"
                      : "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : isDanger 
                      ? "text-rose-500 hover:bg-rose-500/10"
                      : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SETTINGS CONTENT PANEL */}
      <div className="lg:col-span-9 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg p-6 sm:p-8 shadow-xs">
        <AnimatePresence mode="wait">
          
          {/* PERSONAL SECTION */}
          {activeSection === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    Personal Information
                  </h4>
                  <p className="text-[11px] text-zinc-400">Manage user identity credentials on this terminal node.</p>
                </div>
                {savedSuccess && (
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Synchronized
                  </span>
                )}
              </div>

              {/* AVATAR HERO DISPLAY */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-900">
                <div className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-mono font-bold text-sm flex items-center justify-center border border-zinc-800 dark:border-zinc-200 shrink-0">
                  {isGuest ? "GU" : (user?.avatar || "US")}
                </div>
                <div className="text-center sm:text-left space-y-0.5">
                  <h5 className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wide">
                    {isGuest ? "Guest User" : name}
                  </h5>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {isGuest ? "Guest ID: Temporary Session" : (user?.level || "Elite Member")}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold uppercase tracking-wider ${isGuest ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-800'}`}>
                    {isGuest ? "Limited Transient Client" : "✓ Secured Verification Node"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Explorer ID / Name</label>
                    <input 
                      type="text" 
                      required
                      disabled={isGuest}
                      value={isGuest ? "Guest User" : name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-500 disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Secure Email</label>
                    <input 
                      type="email" 
                      required={!isGuest}
                      disabled={isGuest}
                      value={isGuest ? "Unavailable in Guest Mode" : email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-500 disabled:opacity-40"
                      placeholder="e.g. explorer@travelai.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Linked Phone</label>
                    <input 
                      type="text" 
                      disabled={isGuest}
                      value={isGuest ? "Unavailable in Guest Mode" : phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-500 disabled:opacity-40 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Device Authorization</label>
                    <input 
                      type="text" 
                      disabled
                      value={isGuest ? "Muted during Guest session" : "Phone OTP Authorized"} 
                      className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-600 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isGuest}
                  className="px-4 py-2 bg-zinc-900 dark:bg-white dark:text-black text-white hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Save className="w-3.5 h-3.5" /> Synchronize Identity Data
                </button>
              </form>
            </motion.div>
          )}

          {/* TRAVEL PREFERENCES SECTION */}
          {activeSection === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Travel Preferences
                </h4>
                <p className="text-[11px] text-zinc-400">Configure parameters used to formulate custom AI itineraries.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Base Currency</label>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-850 dark:text-zinc-250 focus:outline-hidden focus:border-zinc-500"
                  >
                    <option value="INR">INR (₹) Indian Rupee</option>
                    <option value="USD">USD ($) United States Dollar</option>
                    <option value="EUR">EUR (€) Euro Union</option>
                    <option value="JPY">JPY (¥) Japanese Yen</option>
                    <option value="GBP">GBP (£) British Pound</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">System Language</label>
                  <select 
                    value={lang} 
                    onChange={e => setLang(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-850 dark:text-zinc-250 focus:outline-hidden focus:border-zinc-500"
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">Hindi (India)</option>
                    <option value="fr">French (France)</option>
                    <option value="es">Spanish (Spain)</option>
                    <option value="ja">Japanese (Japan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Aesthetic Layout</label>
                  <select 
                    value={isDarkMode ? "dark" : "light"} 
                    onChange={e => setIsDarkMode(e.target.value === "dark")}
                    className="w-full text-xs font-semibold p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-850 dark:text-zinc-250 focus:outline-hidden focus:border-zinc-500"
                  >
                    <option value="dark">🌑 Monochromatic Pure Dark</option>
                    <option value="light">☀️ Monochromatic Pure Light</option>
                  </select>
                </div>
              </div>

              {/* SLIDER FOR TRAVEL LIMITS */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">AIGS Default Budget Cap</label>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">₹{budgetLimit.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min={1000} 
                  max={200000} 
                  step={5000}
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(parseInt(e.target.value) || 25000)}
                  className="w-full accent-zinc-900 dark:accent-white h-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500">
                  Our system logic compiles hotels, flight carriers, and cab transits dynamically beneath this preset ceiling rate.
                </p>
              </div>

              {/* SAVE PREFERENCES CARD */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Default Accommodation Class</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["Homestay", "Vetted Hotels", "Elite Resort"].map((style, idx) => (
                    <div key={idx} className="p-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-md text-[10px] font-bold text-center text-zinc-700 dark:text-zinc-300 uppercase font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                      {style}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* BOOKINGS HISTORY SECTION */}
          {activeSection === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Bookings Ledger
                </h4>
                <p className="text-[11px] text-zinc-400">Review completed transactions, receipts, and active flight schedules.</p>
              </div>

              {isGuest ? (
                /* Guest booking warning */
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center space-y-2">
                  <Layers className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">No Active Guest Bookings</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Transient guest nodes do not write persistence ledgers. Establish a verified login credential to record airline itineraries.
                  </p>
                </div>
              ) : (
                /* Registered user bookings */
                <div className="space-y-3">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Flight BOM ➔ GOI</p>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">AirIndia carriers (Verified No-Scam)</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Date: July 15, 2026 • 2 Pax</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 px-2 py-1 text-zinc-900 dark:text-zinc-200 rounded">
                      ₹8,700 Paid
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-zinc-500">Candolim Beachfront Lodge</p>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Booking.com partner homestay</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Duration: 3 Nights • Standard King Suite</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 px-2 py-1 text-zinc-900 dark:text-zinc-200 rounded">
                      ₹7,200 Paid
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* WALLET HUB SECTION */}
          {activeSection === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Wallet Hub
                </h4>
                <p className="text-[11px] text-zinc-400">Verify wallet balances, cashbacks, and linked credit pathways.</p>
              </div>

              {isGuest ? (
                /* Guest Wallet Muted */
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center space-y-2">
                  <CreditCard className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Wallet Hub Offline</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Wallet security policies prohibit temporary guest access. Register an identity credentials card to lock in 10% cashbacks.
                  </p>
                </div>
              ) : (
                /* Registered Wallet */
                <div className="space-y-4">
                  <div className="p-6 bg-zinc-950 text-white rounded-lg border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-40">
                    <div className="absolute top-0 right-0 bg-white/10 w-24 h-24 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Active Travel Wallet</p>
                        <p className="text-2xl font-black mt-1 font-mono">₹45,230</p>
                      </div>
                      <span className="text-[9px] font-mono border border-zinc-700 px-2 py-0.5 rounded uppercase tracking-wider">
                        SECURED VIP
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-mono tracking-widest">•••• •••• •••• 9928</p>
                      <p className="text-[9px] text-zinc-400 uppercase font-bold mt-1">Exp: 09/31 • Cardholder: {name}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Automatic Cashback Rebates (10%)</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">Enabled</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* REWARDS SECTION */}
          {activeSection === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Rewards Ledger & Status
                </h4>
                <p className="text-[11px] text-zinc-400">Earn tier experience points (XP) for creating community logs.</p>
              </div>

              {isGuest ? (
                /* Guest Rewards warning */
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center space-y-2">
                  <Award className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Rewards Hub Blocked</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Transient credentials cannot accumulate loyalty benefits. Login now to register custom vouchers and checkouts.
                  </p>
                </div>
              ) : (
                /* Registered user rewards */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center">
                      <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Available Points Balance</p>
                      <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">3,450 XP</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center">
                      <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">Loyalty Level</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white mt-2 uppercase tracking-wide">Silver Nomad Elite</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">Active Perks</h5>
                    <ul className="text-[11px] text-zinc-500 space-y-1.5 mt-2 list-disc pl-4 font-semibold">
                      <li>Free seat selection on premium flight carriers</li>
                      <li>Vetted homestays include complimentary early breakfast</li>
                      <li>Direct secure concierge desk access with 10-second response</li>
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PRIVACY POLICIES */}
          {activeSection === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Privacy Policies
                </h4>
                <p className="text-[11px] text-zinc-400">Govern cookies, telemetry, and external map overlay databases.</p>
              </div>

              {/* Persisted scam heatmap overlay toggle */}
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Scam Heatmap Filter</p>
                    <p className="text-[11px] text-zinc-400">Enable scam overlays and warnings across live vector maps.</p>
                  </div>
                  <button 
                    onClick={handleToggleScamHeatmap}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${scamHeatmapEnabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${scamHeatmapEnabled ? "translate-x-4 bg-white dark:bg-black" : "translate-x-0 bg-zinc-400 dark:bg-zinc-600"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-start gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Strict Local Privacy</p>
                    <p className="text-[11px] text-zinc-400">Write session caches directly to device storage; bypass external clouds.</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 px-2 py-1 rounded text-zinc-500">
                    ALWAYS ACTIVE
                  </span>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-[10px] text-zinc-500 leading-normal font-mono">
                  TravelAI strictly adheres to GDPR zero-telemetry protocols. We do not transmit coordinates or personal budget criteria to third-party ad brokers. Your itinerary remains completely sealed inside this terminal container.
                </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY & PROTOCOLS SECTION */}
          {activeSection === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Security & Encryption
                </h4>
                <p className="text-[11px] text-zinc-400">Enable device security layer and view direct node access histories.</p>
              </div>

              <div className="space-y-4">
                {/* PERSISTENT BIOMETRIC TOGGLE */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Biometric Encryption</p>
                    <p className="text-[11px] text-zinc-400">Enable biometric device authentication during checkout pathways.</p>
                  </div>
                  <button 
                    onClick={handleToggleBiometric}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${biometricEnabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${biometricEnabled ? "translate-x-4 bg-white dark:bg-black" : "translate-x-0 bg-zinc-400 dark:bg-zinc-600"}`} />
                  </button>
                </div>

                {/* PERSISTENT SECURE AUDIT LOG TOGGLE */}
                <div className="flex justify-between items-start gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Secure Audit Log</p>
                    <p className="text-[11px] text-zinc-400">Store device login history and active proxy logs securely.</p>
                  </div>
                  <button 
                    onClick={handleToggleSecureAudit}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${secureAuditLogEnabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${secureAuditLogEnabled ? "translate-x-4 bg-white dark:bg-black" : "translate-x-0 bg-zinc-400 dark:bg-zinc-600"}`} />
                  </button>
                </div>

                {/* Secure Server API Configuration Info */}
                <div className="pt-4 border-t border-zinc-150 dark:border-zinc-900 space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Server API Security</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      AI services are authenticated securely on the backend server. Personal API keys are never stored in browser storage or sent to untrusted third parties.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        Environment Variable (<code className="text-emerald-600 dark:text-emerald-400">GEMINI_API_KEY</code>)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                      SECURED ON SERVER
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Notifications Control
                </h4>
                <p className="text-[11px] text-zinc-400">Configure real-time alert filters and automated price watchers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Interactive Price Drop Alerts</p>
                    <p className="text-[11px] text-zinc-400">Dispatch instant notifications when carrier prices decrease below standard rates.</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 px-2 py-1 rounded text-zinc-500">
                    ACTIVE
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Marketing & Deals</p>
                    <p className="text-[11px] text-zinc-400">Receive seasonal transport discounts and direct flight carrier cashbacks.</p>
                  </div>
                  <button 
                    onClick={handleToggleMarketing}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${marketingNotifications ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${marketingNotifications ? "translate-x-4 bg-white dark:bg-black" : "translate-x-0 bg-zinc-400 dark:bg-zinc-600"}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONNECTED ACCOUNTS */}
          {activeSection === "connected" && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Connected Accounts
                </h4>
                <p className="text-[11px] text-zinc-400">Manage linkages with third-party travel carries and identity keys.</p>
              </div>

              {isGuest ? (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-center space-y-2">
                  <Link2 className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Syncing Disabled</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Transient credentials cannot link cloud providers. Establish a verified terminal account to proceed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">Google secure credential node</p>
                      <p className="text-[10px] text-zinc-400">Status: Linked • Last verified 2 hours ago</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 rounded">
                      Disconnect
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">Apple ID auth node</p>
                      <p className="text-[10px] text-zinc-400">Status: Not linked</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-zinc-900 dark:bg-white text-white dark:text-black px-2.5 py-1 rounded cursor-pointer hover:opacity-80 transition-colors">
                      Connect
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* DELETE ACCOUNT (DANGER ZONE) */}
          {activeSection === "delete" && (
            <motion.div
              key="delete"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="pb-3 border-b border-rose-500/20">
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Danger Zone
                </h4>
                <p className="text-[11px] text-zinc-400">Terminate guest session or execute complete closure of credentials.</p>
              </div>

              <div className="p-4 bg-rose-500/5 border border-rose-500/15 dark:border-rose-500/20 rounded-md space-y-4">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal font-semibold">
                  {isGuest 
                    ? "Terminating your guest session will wipe out all temporary itineraries, active maps, and chat logs irreversibly."
                    : "Closing your TravelAI terminal account is permanent. Your silver nomad loyalty XP (3,450 points), secure wallets, and offline maps will be destroyed."
                  }
                </p>

                {/* Interactive password verification modal built-in */}
                <form onSubmit={handleDeleteSubmit} className="space-y-4 pt-2">
                  {!isGuest && (
                    <div className="space-y-1.5 max-w-xs text-left">
                      <label className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest block">
                        Confirm Deletion Protocol
                      </label>
                      <p className="text-[10px] text-zinc-400 leading-normal">
                        Please type <strong className="text-zinc-900 dark:text-white">DELETE</strong> to confirm account termination:
                      </p>
                      <div className="relative">
                        <input 
                          type={showDeletePassword ? "text" : "password"}
                          required
                          value={deleteConfirmPassword}
                          onChange={e => {
                            setDeleteConfirmPassword(e.target.value);
                            setDeleteError("");
                          }}
                          placeholder="Type 'DELETE'"
                          className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-xs font-mono font-bold rounded-md focus:outline-hidden text-rose-500 placeholder:text-zinc-400"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          {showDeletePassword ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                        </button>
                      </div>
                      {deleteError && (
                        <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-400" /> {deleteError}
                        </p>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isDeleting}
                    className="w-full sm:w-auto h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        {isGuest ? "Terminate Guest Session" : "Permanently Delete My Account"}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
