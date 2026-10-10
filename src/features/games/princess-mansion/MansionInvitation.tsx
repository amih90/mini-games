'use client';

import Image from 'next/image';
import { useEffect, type CSSProperties, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { artUrl, type PrincessId } from './data';
import { MansionDialog } from './MansionDialog';
import styles from './mansion.module.css';

type ConfettiStyle = CSSProperties & { '--fall-x': string; '--fall-delay': string; '--fall-spin': string };
const COLORS = ['#eab6c9', '#ead09b', '#9fc6b4', '#b7a4d0', '#94c8dc', '#f2bd93'];
const CONFETTI = Array.from({ length: 36 }, (_, index) => {
  const style: ConfettiStyle = {
    '--fall-x': `${(index * 37 + 11) % 100}vw`, '--fall-delay': `${index % 9 * 0.055}s`,
    '--fall-spin': `${90 + index * 29}deg`, backgroundColor: COLORS[index % COLORS.length],
  };
  return style;
});

export function MansionInvitation({ id, adventureId, pendingCount, away, returnFocus, onAnnounce, onInvite, onLater }: {
  id: PrincessId; adventureId: string; pendingCount: number; away: boolean; returnFocus: RefObject<HTMLElement | null>;
  onAnnounce(key: string): void; onInvite(): void; onLater(): void;
}) {
  const t = useTranslations('princessMansion');
  const key = `${adventureId}:${id}`;
  useEffect(() => { onAnnounce(key); }, [key, onAnnounce]);
  const invite = () => { onAnnounce(key); onInvite(); };
  const later = () => { onAnnounce(key); onLater(); };
  return <>
    <div className={styles.invitationConfetti} data-testid="invitation-confetti" aria-hidden="true">{CONFETTI.map((style, index) => <i key={index} style={style} />)}</div>
    <MansionDialog title={t('unlockTitle', { name: t(`princesses.${id}`) })} closeLabel={t('close')} returnFocus={returnFocus} onClose={later} onInteraction={() => onAnnounce(key)}>
      <div className={styles.invitationPortrait}><span aria-hidden="true">{'\u2726'}</span><Image src={artUrl(`characters/${id}-portrait.svg`)} width={210} height={210} alt={t(`princesses.${id}`)} /><span aria-hidden="true">{'\u2726'}</span></div>
      <p className={styles.dialogDescription}>{t('unlockDescription')}</p>
      {away && <p className={styles.collectionNote}>{t('awaitingAtHome')}</p>}
      {pendingCount > 1 && <p className={styles.saveNote}>{t('unlockQueue', { count: pendingCount })}</p>}
      <div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={invite}><Image src={artUrl('icons/heart.svg')} width={48} height={48} alt="" /><span>{t('inviteNow')}</span></button><button type="button" className={styles.button} onClick={later}><Image src={artUrl('icons/album.svg')} width={48} height={48} alt="" /><span>{t('inviteLater')}</span></button></div>
    </MansionDialog>
  </>;
}
