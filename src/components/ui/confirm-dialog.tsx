"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "destructive";
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

/**
 * useConfirm() — 어디서든 호출 가능한 비동기 확인 다이얼로그.
 * native `confirm()` 대체. 예쁘고 일관된 스타일.
 */
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ options, resolve });
      }),
    [],
  );

  function handle(v: boolean) {
    if (state) {
      state.resolve(v);
      setState(null);
    }
  }

  const opts = state?.options;
  const isDestructive = opts?.tone === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!state}
        onOpenChange={(open) => {
          if (!open) handle(false);
        }}
      >
        <DialogContent className="max-w-[380px] gap-0 overflow-hidden p-0">
          <div className="px-6 pt-6 pb-3">
            <div className="mb-3 flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  isDestructive
                    ? "bg-red-500/10 text-red-500"
                    : "bg-fg/8 text-fg-muted",
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className="text-[16px] font-semibold tracking-tight text-fg">
                  {opts?.title ?? ""}
                </DialogTitle>
                {opts?.description && (
                  <DialogDescription className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                    {opts.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 border-t border-border/60 bg-bg-subtle/40 px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => handle(false)}
              className="flex-1 rounded-xl"
            >
              {opts?.cancelText ?? "취소"}
            </Button>
            <Button
              onClick={() => handle(true)}
              className={cn(
                "flex-1 rounded-xl",
                isDestructive && "bg-red-500 text-white hover:bg-red-500/90",
              )}
            >
              {opts?.confirmText ?? "확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
