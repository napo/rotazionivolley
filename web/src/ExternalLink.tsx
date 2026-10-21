import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { isTauri } from '@tauri-apps/api/core';

/**
 * Link that opens outside the app. On the web (and in Capacitor, which hands
 * external URLs to the system) it's a plain target="_blank" link; the Tauri
 * desktop webview doesn't open those, so there the click goes to the system
 * browser through the opener plugin (src-tauri/src/lib.rs).
 */
export function ExternalLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!isTauri()) return;
    event.preventDefault();
    void import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(href)).catch(() => {});
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} {...props} />;
}
