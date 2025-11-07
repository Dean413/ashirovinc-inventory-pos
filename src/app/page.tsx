"use client";

import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically redirect to dashboard
  redirect("/dashboard");
}
