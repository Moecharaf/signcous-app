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
  openOnHover?: boolean;
  inlineContent?: ReactNode;
  inlineAlways?: boolean;
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
  const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null);
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

  const openPanelFromElement = useCallback((panelId: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setPanelAnchor({ left: rect.left, top: rect.top, width: rect.width });
    setActivePanelId(panelId);
  }, []);

  const togglePanel = useCallback(
    (panelId: string, event: React.MouseEvent<HTMLButtonElement>) => {
      if (activePanelId === panelId) {
        closePanel();
        return;
      }

      openPanelFromElement(panelId, event.currentTarget);
    },
    [activePanelId, closePanel, openPanelFromElement]
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
      <div className="border-t border-zinc-200 bg-white px-2 py-1.5">
        <div className="grid gap-1.5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-1.5 [grid-template-columns:repeat(auto-fit,minmax(122px,1fr))]">
            {panels.map((panel) => (
              panel.inlineContent ? (
                <div
                  key={panel.id}
                  onMouseEnter={() => setHoveredPanelId(panel.id)}
                  onMouseLeave={() => setHoveredPanelId((prev) => (prev === panel.id ? null : prev))}
                  className={`min-w-0 rounded-[2px] border-2 px-2 py-1 text-left transition ${
                    hoveredPanelId === panel.id
                      ? "border-[#007fff] bg-white shadow-sm"
                      : "border-[#007fff] bg-[#f7fbff]"
                  }`}
                >
                  <div className="flex min-h-[42px] items-center justify-between gap-2">
                    <span className={`min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.12em] ${hoveredPanelId === panel.id ? "text-[#0068d1]" : "text-[#4f5f72]"}`}>{panel.title}</span>
                    {panel.inlineAlways || hoveredPanelId === panel.id ? (
                      <div className="shrink-0">{panel.inlineContent}</div>
                    ) : (
                      <span
                        className={`inline-flex h-7 min-w-[62px] items-center justify-center shrink-0 rounded-[1px] px-2 text-[11px] font-bold tracking-[0.06em] ${
                          panel.status === "alert"
                            ? "bg-rose-500 text-white"
                            : panel.status === "neutral"
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-[#007fff] text-white"
                        }`}
                      >
                        {panel.value}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  key={panel.id}
                  type="button"
                  data-role="builder-toolbar-button"
                  onClick={(event) => togglePanel(panel.id, event)}
                  onMouseEnter={(event) => {
                    if (panel.openOnHover) {
                      openPanelFromElement(panel.id, event.currentTarget);
                    }
                  }}
                  className={`min-w-0 rounded-[2px] border-2 px-2 py-1 text-left transition ${
                    activePanelId === panel.id
                      ? "border-[#007fff] bg-white shadow-sm"
                      : "border-[#007fff] bg-[#f7fbff]"
                  }`}
                >
                  <div className="flex min-h-[42px] items-center justify-between gap-2">
                    <span className={`min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.12em] ${activePanelId === panel.id ? "text-[#0068d1]" : "text-[#4f5f72]"}`}>{panel.title}</span>
                    <span
                      className={`inline-flex h-7 min-w-[62px] items-center justify-center shrink-0 rounded-[1px] px-2 text-[11px] font-bold tracking-[0.06em] ${
                        panel.status === "alert"
                          ? "bg-rose-500 text-white"
                          : panel.status === "neutral"
                            ? "bg-zinc-100 text-zinc-600"
                            : activePanelId === panel.id
                              ? "bg-[#007fff] text-white"
                              : "bg-[#007fff] text-white"
                      }`}
                    >
                      {panel.value}
                    </span>
                  </div>
                </button>
              )
            ))}
          </div>

          <div className="rounded-lg border border-[#007fff]/20 bg-[#007fff]/5 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#007fff]">{actionTitle}</div>
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