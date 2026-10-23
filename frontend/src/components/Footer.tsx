import React from "react";
import { Bot, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-black text-center text-xs text-white/40">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white/80 font-medium">ZentroMart AI Voice Assistant</span>
        </div>

        <p className="flex items-center gap-1.5">
          <span>VoiceOps 2026 Capstone</span>
          <span>•</span>
          <span>IIT Guwahati × Gnani.ai</span>
        </p>

        <p className="text-white/30 text-[11px]">
          Synthetic data frozen on 20 October 2026. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
