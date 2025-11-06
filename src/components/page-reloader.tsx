// components/FullPageLoader.tsx
"use client";

import Image from "next/image";

export default function FullPageLoader({
  text = "",
}: {
  text?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Replace /logo.png with your actual logo path */}
      <Image
        src="/ashirov-logo.jpg"
        alt="Logo"
        width={80}
        height={80}
        className="spin-slow rounded-full"   // custom slow spin
        priority
      />
      <p className="text-white text-lg font-medium mt-4">{text}</p>
    </div>
  );
}
