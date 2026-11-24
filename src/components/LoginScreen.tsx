import React, { useState } from "react";
import {
  Phone, ShieldCheck, Compass, ArrowRight, AlertCircle,
  RefreshCw, CheckCircle2, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

// Branded Google SVG Icon
const GoogleLogo = () => (
  <svg aria-hidden="true" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

// Branded Apple SVG Icon
const AppleLogo = () => (
  <svg aria-hidden="true" className="w-4 h-4 mr-2 fill-current text-zinc-950" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.11.09 2.25-.57 2.94-1.39z" />
  </svg>
);

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Authentication methods
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successState, setSuccessState] = useState<"none" | "otp_sent" | "verified">("none");
  const [errorState, setErrorState] = useState("");

  // OTP Validation State
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");

  // Validation routines
  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      return "Phone number is required.";
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      return "Enter a valid 10-12 digit phone number.";
    }
    return "";
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePhone(phoneNumber);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }
    
    setPhoneError("");
    setIsSubmitting(true);
    setErrorState("");

    // Simulate OTP generation & dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessState("otp_sent");
    }, 1200);
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length < 6) {
      setOtpError("All 6 digits are required.");
      return;
    }

    setOtpError("");
    setIsSubmitting(true);
    setErrorState("");

    // Simulate validation
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessState("verified");
      
      // Complete login sequence
      setTimeout(() => {
        onLoginSuccess({
          name: "Vagabond Explorer",
          email: "explorer@travelai.com",
          avatar: "VE",
          role: "Pro Explorer",
          level: "Level 1 Starter Member",
          provider: "Phone OTP Secure",
          isGuest: false
        });
      }, 800);
    }, 1200);
  };

  const handleSocialLogin = (provider: "Google" | "Apple") => {
    setIsSubmitting(true);
    setErrorState("");
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessState("verified");
      
      setTimeout(() => {
        onLoginSuccess({
          name: `Verified ${provider} User`,
          email: `secured_${provider.toLowerCase()}@travelai.com`,
          avatar: provider === "Google" ? "G" : "A",
          role: "Pro Explorer",
          level: "Verified Explorer VIP",
          provider: `${provider} Auth`,
          isGuest: false
        });
      }, 800);
    }, 1000);
  };

  const handleGuestLogin = () => {
    setIsSubmitting(true);
    setErrorState("");

    setTimeout(() => {
      setIsSubmitting(false);
      
      // Guest profile must always display: Guest User, Anonymous Traveler, Guest Session
      onLoginSuccess({
        name: "Guest User",
        email: "", // No email
        avatar: "GU", // Guest Avatar
        role: "Anonymous Traveler", // Anonymous Traveler
        level: "Guest Session", // Guest Session
        provider: "Guest Mode",
        isGuest: true
      });
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.substring(value.length - 1);
    setOtpCode(newOtp);
    setOtpError("");

    // Focus next input automatically
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950 lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(420px,.82fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&auto=format&fit=crop&q=88"
          alt="A tropical shoreline at sunset"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-zinc-950/25" />
        <div className="absolute left-12 right-12 top-12 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/10 backdrop-blur-md">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold font-display">TravelAI</span>
          </div>
          <span className="text-sm text-white/80">Goa, India · 31°C</span>
        </div>
        <div className="absolute bottom-12 left-12 right-12 max-w-xl text-white">
          <p className="mb-4 text-sm text-white/70">The Indian coast, November to February</p>
          <h2 className="max-w-lg text-5xl font-bold leading-[1.05] tracking-tight font-display">
            The next good place is closer than it feels.
          </h2>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Compass className="h-4 w-4" />
            </div>
            <span className="font-bold font-display">TravelAI</span>
          </div>
          <ShieldCheck className="h-5 w-5 text-zinc-400" />
        </div>

        <div className="my-auto w-full max-w-md self-center">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold text-zinc-500">Your journey starts here</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight font-display sm:text-5xl">
            Welcome back.
          </h1>
        </div>
        <div>
          
          <AnimatePresence mode="wait">
            {successState === "verified" ? (
              /* VERIFICATION SUCCESS SCREEN */
              <motion.div
                key="verified-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-display">Identity verified</h3>
                  <p className="text-sm text-zinc-500">Opening your travel workspace...</p>
                </div>
              </motion.div>
            ) : successState === "otp_sent" ? (
              /* OTP VERIFICATION CODE SCREEN */
              <motion.div
                key="otp-verification-screen"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-display">Check your phone</h3>
                  <p className="text-sm text-zinc-500">
                    Enter the code sent to {phoneNumber}.
                  </p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div className="flex justify-between gap-1.5 max-w-xs mx-auto">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        required
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        className="h-14 w-12 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-lg font-bold text-zinc-950 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-sm text-red-700 flex items-center gap-2 justify-center">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {otpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-zinc-950 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Verify and continue <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuccessState("none")}
                    className="w-full text-center text-sm text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    Change phone number
                  </button>
                </form>
              </motion.div>
            ) : (
              /* PHONE OTP SIGN-IN VIEW */
              <motion.div
                key="phone-sign-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* SIGN IN FORM */}
                <form onSubmit={handlePhoneSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 block">Phone number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={e => {
                          setPhoneNumber(e.target.value);
                          setPhoneError("");
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full h-14 pl-11 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 text-base text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />
                    </div>
                    {phoneError && (
                      <p className="text-sm text-red-700 mt-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {phoneError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Send verification code <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  {/* CONTINUOUS GUEST ACCESS */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      className="w-full h-12 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" /> Continue as guest
                    </button>
                  </div>
                </form>

                {/* SOCIAL IDENTITIES */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-200"></div>
                  <span className="flex-shrink mx-3 text-xs text-zinc-400">or continue with</span>
                  <div className="flex-grow border-t border-zinc-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Google")}
                    className="h-12 bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-center transition-colors rounded-xl text-sm font-bold text-zinc-800"
                    title="Sign in with Google"
                  >
                    <GoogleLogo /> Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Apple")}
                    className="h-12 bg-white hover:bg-zinc-50 border border-zinc-200 flex items-center justify-center transition-colors rounded-xl text-sm font-bold text-zinc-800"
                    title="Sign in with Apple"
                  >
                    <AppleLogo /> Apple
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure, encrypted sign-in
        </p>
      </section>
    </main>
  );
}
