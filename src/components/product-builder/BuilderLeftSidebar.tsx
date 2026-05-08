"use client";

import {
  Brush,
  Layers,
  LayoutTemplate,
  MessageCircle,
  QrCode,
  Shapes,
  Type,
  Upload,
} from "lucide-react";

const tools = [
  { id: "design", label: "Design", icon: Brush },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "qrcode", label: "QR Code", icon: QrCode },
  { id: "layers", label: "Layers", icon: Layers },
];

interface BuilderLeftSidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export default function BuilderLeftSidebar({ activeTool, onToolChange }: BuilderLeftSidebarProps) {
  return (
    <aside className="flex w-20 flex-shrink-0 flex-col items-center bg-[#111111] py-3">
      {/* Tool nav */}
      <nav className="flex flex-1 flex-col items-center gap-1 w-full px-1.5">
        {tools.map(({ id, label, icon: Icon }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToolChange(id)}
              title={label}
              className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#ff7f00]/15 text-[#ff7f00]"
                  : "text-zinc-400 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className="transition-colors duration-200"
              />
              <span className="leading-tight text-center">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Help card */}
      <div className="w-full px-2 pb-2">
        <div className="rounded-xl bg-white/5 p-2.5 text-center">
          <MessageCircle size={16} className="mx-auto mb-1.5 text-zinc-400" />
          <p className="mb-2 text-[9px] leading-tight text-zinc-400">Need help with your design?</p>
          <button
            type="button"
            className="w-full rounded-lg bg-[#007fff] px-1 py-1.5 text-[9px] font-semibold text-white transition-colors hover:bg-[#0066cc]"
          >
            Start Chat
          </button>
        </div>
      </div>
    </aside>
  );
}
