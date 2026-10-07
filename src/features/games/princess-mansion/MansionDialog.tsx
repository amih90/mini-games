'use client';

import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { useDialogFocus } from '../shared/useDialogFocus';
import styles from './mansion.module.css';

export function MansionDialog({ title, children, onClose, closeLabel, returnFocus }: {
  title: string; children: ReactNode; onClose?: () => void; closeLabel: string; returnFocus?: RefObject<HTMLElement | null>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(true, panel, onClose, returnFocus);
  return (
    <div className={styles.backdrop}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={styles.dialog}>
        <div className={styles.dialogMagic} aria-hidden="true"><span>✦</span><span>♛</span><span>✦</span></div>
        <div className={styles.dialogHeader}>
          <h2 id={titleId}>{title}</h2>
          {onClose && <button type="button" className={styles.iconButton} onClick={onClose} aria-label={closeLabel}>×</button>}
        </div>
        {children}
      </div>
    </div>
  );
}
