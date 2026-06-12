"use client";

import { siteConfig } from "@/lib/config";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const url = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de solicitar um orçamento.")}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform" aria-label="WhatsApp">
      <MessageCircle className="h-7 w-7" fill="white" />
    </a>
  );
}
