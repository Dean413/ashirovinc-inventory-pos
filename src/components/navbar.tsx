"use client";
import { supabase } from "@/lib/supabaseclient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false); // ✅

  useEffect(() => {
    setMounted(true); // wait until client renders
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = currentTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // change to true for AM/PM
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
      <div>
        <h1 className="text-gray-700 font-bold text-2xl">Ashirov Technology</h1>
        {/* ✅ Render only after mount to avoid SSR mismatch */}
        {mounted && (
          <>
            <span className="text-gray-500 text-sm">{date}</span>{" "}
            <span className="text-gray-500 text-sm">{time}</span>
          </>
        )}
      </div>
    </header>
  );
}
