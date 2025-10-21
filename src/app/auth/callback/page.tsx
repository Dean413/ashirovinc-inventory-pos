"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";


export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleSession = async () => {
      // Get the current session
      const { data, error } = await supabase.auth.getSession();

      if (data.session) {
        setLoading(false)
        // ✅ User is logged in → redirect to dashboard
        router.push("/dashboard");
      } else {
        // ❌ Not logged in → back to sign-in
        router.push("/login");
      }
    };

    handleSession();
  }, [router, supabase]);

 
}
