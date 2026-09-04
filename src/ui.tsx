import { cloneElement, createContext, isValidElement, ReactElement, ReactNode, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { TOAST_EVENT, type ToastDetail } from "./toast";

type OpenValue = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = createContext<OpenValue | null>(null);
const SheetContext = createContext<OpenValue | null>(null);
const AlertContext = createContext<OpenValue | null>(null);
const TabsContext = createContext<{ value: string; setValue: (value: string) => void } | null>(null);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) { return <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>{children}</DialogContext.Provider>; }
export function DialogContent({ className = "", children }: { className?: string; children: ReactNode }) { const context = useContext(DialogContext); if (!context?.open) return null; return <div className="modal-overlay" role="presentation" onMouseDown={() => context.setOpen(false)}><section className={`modal-panel ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Cerrar" onClick={() => context.setOpen(false)}><X /></button>{children}</section></div>; }
export function DialogHeader({ className = "", children }: { className?: string; children: ReactNode }) { return <header className={`dialog-header ${className}`}>{children}</header>; }
export function DialogTitle({ children }: { children: ReactNode }) { return <h2 className="dialog-title">{children}</h2>; }
export function DialogDescription({ children }: { children: ReactNode }) { return <p className="dialog-description">{children}</p>; }

export function Sheet({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) { const [internal, setInternal] = useState(false); const controlled = typeof open === "boolean"; const setOpen = (next: boolean) => { if (!controlled) setInternal(next); onOpenChange?.(next); }; return <SheetContext.Provider value={{ open: controlled ? open : internal, setOpen }}>{children}</SheetContext.Provider>; }
export function SheetTrigger({ children }: { asChild?: boolean; children: ReactElement }) { const context = useContext(SheetContext); if (!isValidElement(children)) return children; return cloneElement(children, { onClick: () => context?.setOpen(true) } as Record<string, unknown>); }
export function SheetContent({ className = "", children }: { className?: string; side?: string; children: ReactNode }) { const context = useContext(SheetContext); if (!context?.open) return null; return <div className="sheet-overlay" role="presentation" onMouseDown={() => context.setOpen(false)}><aside className={`sheet-panel ${className}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Cerrar" onClick={() => context.setOpen(false)}><X /></button>{children}</aside></div>; }
export function SheetHeader({ children }: { children: ReactNode }) { return <header className="dialog-header">{children}</header>; }
export function SheetTitle({ children }: { children: ReactNode }) { return <h2 className="dialog-title">{children}</h2>; }
export function SheetDescription({ children }: { children: ReactNode }) { return <p className="dialog-description">{children}</p>; }

export function AlertDialog({ children }: { children: ReactNode }) { const [open, setOpen] = useState(false); return <AlertContext.Provider value={{ open, setOpen }}>{children}</AlertContext.Provider>; }
export function AlertDialogTrigger({ children }: { asChild?: boolean; children: ReactElement }) { const context = useContext(AlertContext); return isValidElement(children) ? cloneElement(children, { onClick: () => context?.setOpen(true) } as Record<string, unknown>) : children; }
export function AlertDialogContent({ children }: { children: ReactNode }) { const context = useContext(AlertContext); if (!context?.open) return null; return <div className="modal-overlay" onMouseDown={() => context.setOpen(false)}><section className="modal-panel alert-panel" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{children}</section></div>; }
export function AlertDialogHeader({ children }: { children: ReactNode }) { return <header className="dialog-header">{children}</header>; }
export function AlertDialogTitle({ children }: { children: ReactNode }) { return <h2 className="dialog-title">{children}</h2>; }
export function AlertDialogDescription({ children }: { children: ReactNode }) { return <p className="dialog-description">{children}</p>; }
export function AlertDialogFooter({ children }: { children: ReactNode }) { return <footer className="alert-footer">{children}</footer>; }
export function AlertDialogCancel({ children }: { children: ReactNode }) { const context = useContext(AlertContext); return <button type="button" className="secondary-action" onClick={() => context?.setOpen(false)}>{children}</button>; }
export function AlertDialogAction({ children, onClick }: { children: ReactNode; onClick?: () => void; variant?: string }) { const context = useContext(AlertContext); return <button type="button" className="danger-action" onClick={() => { onClick?.(); context?.setOpen(false); }}>{children}</button>; }

export function Tabs({ defaultValue, className = "", children }: { defaultValue: string; className?: string; children: ReactNode }) { const [value, setValue] = useState(defaultValue); return <TabsContext.Provider value={{ value, setValue }}><div className={className}>{children}</div></TabsContext.Provider>; }
export function TabsList({ children }: { children: ReactNode }) { return <div className="tabs-list" role="tablist">{children}</div>; }
export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) { const context = useContext(TabsContext); return <button type="button" role="tab" aria-selected={context?.value === value} className={context?.value === value ? "active" : ""} onClick={() => context?.setValue(value)}>{children}</button>; }
export function TabsContent({ value, children }: { value: string; children: ReactNode }) { const context = useContext(TabsContext); return context?.value === value ? <div role="tabpanel">{children}</div> : null; }

export function InputOTP({ maxLength, value, onChange }: { maxLength: number; value: string; onChange: (value: string) => void; children?: ReactNode }) { return <input className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, maxLength))} aria-label="Código de verificación" />; }
export function InputOTPGroup(_props: { children: ReactNode }) { return null; }
export function InputOTPSlot(_props: { index: number }) { return null; }

export function Toaster(_props: { position?: string; richColors?: boolean }) { const [detail, setDetail] = useState<ToastDetail | null>(null); useEffect(() => { let timer = 0; const show = (event: Event) => { setDetail((event as CustomEvent<ToastDetail>).detail); window.clearTimeout(timer); timer = window.setTimeout(() => setDetail(null), 3200); }; window.addEventListener(TOAST_EVENT, show); return () => { window.clearTimeout(timer); window.removeEventListener(TOAST_EVENT, show); }; }, []); return detail ? <div className={`toast-premium ${detail.tone}`} role="status"><span>{detail.tone === "error" ? "!" : detail.tone === "info" ? "i" : "✓"}</span>{detail.message}</div> : null; }
