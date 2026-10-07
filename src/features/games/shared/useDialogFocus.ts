import { useEffect, useRef, type RefObject } from 'react';

export function useDialogFocus(active: boolean, ref: RefObject<HTMLElement | null>, onClose?: () => void, returnFocus?: RefObject<HTMLElement | null>): void {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!active || !ref.current) return;
    const panel = ref.current;
    const previous = returnFocus?.current ?? document.activeElement;
    const focusable = () => [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')];
    const initial = panel.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? panel;
    initial.focus({ preventScroll: true });
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && close.current) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) close.current(); }
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      const first = nodes[0] ?? panel;
      const last = nodes[nodes.length - 1] ?? panel;
      if (!panel.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    panel.addEventListener('keydown', handle);
    return () => {
      panel.removeEventListener('keydown', handle);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, ref, returnFocus]);
}
