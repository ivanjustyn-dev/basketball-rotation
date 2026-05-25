import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6">
      <section className="max-h-[90vh] w-full overflow-auto rounded-t-xl bg-white p-5 shadow-soft sm:max-w-lg sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <Button
            aria-label="Close"
            className="min-h-10 px-3"
            icon={<X size={18} />}
            onClick={onClose}
            type="button"
            variant="ghost"
          />
        </div>
        {children}
        {footer ? <div className="mt-5 flex gap-3">{footer}</div> : null}
      </section>
    </div>
  );
}
