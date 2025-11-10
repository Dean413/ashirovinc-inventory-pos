"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push("/login");
    };
    checkAuth();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6">{children}</main>
      
      </div>
    </div>
  );
}
