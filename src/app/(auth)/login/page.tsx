"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter()

  // 🔹 Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp(
      {
        email, 
        options: { shouldCreateUser: true },
      });

    if (error) {
      setMessage(error.message);
    } else {
      setStep("otp");
      setMessage("We sent a 6-digit OTP to your email.");
    }
    setLoading(false);
  };

  // 🔹 Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage(error.message);
    } else {
      await supabase.auth.getSession();
      router.refresh();  // ⬅️ important

      router.push("/dashboard/client-dashboard")
      setMessage("✅ Signed in successfully!");
    }
    setLoading(false);
  };

  // 🔹 Google OAuth
  const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account", // 👈 forces Google to always show account chooser
      },
    },
  });

  if (error) setMessage(error.message);
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sign In to Your Account
        </h1>

        {/* OTP Section */}
        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border p-2 rounded w-full"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="border p-2 rounded w-full"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" onClick={() => {setStep("email"); setOtp(""); setEmail("")}} className="text-blue-700 underline text-sm mt-2 cursor-pointer">Not your email?</button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 my-6">
          <div className="grow h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="grow h-px bg-gray-300"></div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 w-full"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* Message */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
