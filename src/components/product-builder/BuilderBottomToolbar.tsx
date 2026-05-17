"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToolbarStatus = "ok" | "alert" | "neutral";

export interface BuilderBottomToolbarPanel {
  id: string;
  title: string;
  value: string;
  content: ReactNode;
  width?: number;
  status?: ToolbarStatus;
}

interface BuilderBottomToolbarProps {
  panels: BuilderBottomToolbarPanel[];
  action: ReactNode;
  actionTitle?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function BuilderBottomToolbar({
  panels,
  action,
  actionTitle = "Cart Action",
}: BuilderBottomToolbarProps) {
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [panelAnchor, setPanelAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const activePanel = useMemo(
    () => panels.find((panel) => panel.id === activePanelId) ?? null,
    [activePanelId, panels]
  );

  const closePanel = useCallback(() => {
    setActivePanelId(null);
    setPanelAnchor(null);
  }, []);

  const togglePanel = useCallback(
    (panelId: string, event: React.MouseEvent<HTMLButtonElement>) => {
      if (activePanelId === panelId) {
        closePanel();
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      setPanelAnchor({ left: rect.left, top: rect.top, width: rect.width });
      setActivePanelId(panelId);
    },
    [activePanelId, closePanel]
  );

  useEffect(() => {
    if (!activePanel) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    function handlePointerDown(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement;

      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-role="builder-toolbar-button"]')) return;

      closePanel();
    }

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activePanel, closePanel]);

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const panelWidth = activePanel
    ? Math.max(220, Math.min(activePanel.width ?? 320, viewportWidth - 24))
    : 320;
  const panelLeft = panelAnchor
    ? clamp(panelAnchor.left + panelAnchor.width / 2 - panelWidth / 2, 12, Math.max(12, viewportWidth - panelWidth - 12))
    : 12;

  return (
    <>
      <div className="border-t border-zinc-200 bg-white px-3 py-2">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(132px,1fr))]">
            {panels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                data-role="builder-toolbar-button"
                onClick={(event) => togglePanel(panel.id, event)}
                className={`min-w-0 rounded border px-3 py-2 text-left transition ${
                  activePanelId === panel.id
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <span className="text-zinc-500">{panel.title}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      panel.status === "alert"
                        ? "bg-rose-500"
                        : panel.status === "neutral"
                          ? "bg-zinc-300"
                          : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-zinc-800">{panel.value}</div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{actionTitle}</div>
            <div className="mt-3">{action}</div>
          </div>
        </div>
      </div>

      {activePanel && panelAnchor && (
        <div
          ref={panelRef}
          className="fixed z-50 overflow-visible rounded-lg border border-zinc-300 bg-white p-2 shadow-2xl"
          style={{
            width: `${panelWidth}px`,
            left: `${panelLeft}px`,
            top: `${Math.max(16, panelAnchor.top - 10)}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-zinc-300 bg-white" aria-hidden="true" />
          <div className="relative">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">{activePanel.title}</h3>
              <button
                type="button"
                onClick={closePanel}
                className="h-6 rounded border border-zinc-300 px-2 text-[11px] font-semibold text-zinc-600 hover:border-zinc-400"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">{activePanel.content}</div>
          </div>
        </div>
      )}
    </>
  );
}