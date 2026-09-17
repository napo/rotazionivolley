import { useEffect, useRef, useState, type ReactNode } from 'react';
import './controls.css';

interface HeaderDropdownProps {
  label: string;
  children: ReactNode;
}

/** A small "button that opens a panel" control for the header — used for Export, mirrors ConfigPicker's dropdown. */
export function HeaderDropdown({ label, children }: HeaderDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="header-dropdown" ref={rootRef}>
      <button
        type="button"
        className="header-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <span className="header-dropdown__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && <div className="header-dropdown__menu">{children}</div>}
    </div>
  );
}
