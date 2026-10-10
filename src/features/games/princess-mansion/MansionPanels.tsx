'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { INGREDIENT_IDS, RECIPES, RECIPE_IDS, artUrl, getStation, type IngredientId, type OutingId, type PrincessId, type ShopId } from './data';
import { CATALOG, MAX_TREATS, portraitPath, shopItems, type CatalogItem } from './catalog';
import { type Command, type MansionState } from './model';
import styles from './mansion.module.css';

interface InventoryProps {
  state: MansionState;
  feedback: string;
  onCommand(action: Command): boolean;
}

function ContextHelp({ topic }: { topic: 'trips' | 'shopping' | 'lessons' }) {
  const t = useTranslations('princessMansion');
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();
  return <div className={styles.contextHelp} data-testid={`help-${topic}`}>
    <button type="button" aria-expanded={expanded} aria-controls={descriptionId} onClick={() => setExpanded(value => !value)}>
      <span className={styles.helpPicture} aria-hidden="true">?</span><span className={styles.helpLabel}>{t(`instructions.${topic}.title`)}</span>
    </button>
    <p id={descriptionId} hidden={!expanded}>{t(`instructions.${topic}.description`)}</p>
  </div>;
}

export function TravelPanel({ state, onDepart }: { state: MansionState; onDepart(destination: OutingId, companions: PrincessId[]): void }) {
  const t = useTranslations('princessMansion');
  const [destination, setDestination] = useState<OutingId>('mall');
  const [companions, setCompanions] = useState<PrincessId[]>([state.selectedId]);
  const interrupting = state.princesses.some(princess => companions.includes(princess.id) && (princess.activity || princess.autonomy.walk));
  return <>
    <p className={styles.dialogDescription}>{t('trip.description')}</p>
    <ContextHelp topic="trips" />
    <fieldset className={styles.travelPlaces}><legend>{t('trip.choosePlace')}</legend>
      {(['mall', 'beach'] as const).map(id => <label key={id} className={`${styles.destinationCard} ${destination === id ? styles.chosenDestination : ''}`}>
        <input type="radio" name="mansion-destination" value={id} checked={destination === id} onChange={() => setDestination(id)} />
        <Image src={artUrl(`rooms/${id === 'mall' ? 'boutique' : 'beach'}.svg`)} width={232} height={103} alt="" />
        <strong>{t(`destinations.${id}`)}</strong>
      </label>)}
    </fieldset>
    <fieldset className={styles.companionChoices}><legend>{t('trip.companions')}</legend>
      {state.princesses.map(princess => <label key={princess.id} className={`${styles.companionChoice} ${companions.includes(princess.id) ? styles.chosenCompanion : ''}`}>
        <input type="checkbox" checked={companions.includes(princess.id)} onChange={event => setCompanions(previous => event.target.checked ? [...previous, princess.id] : previous.filter(id => id !== princess.id))} />
        <Image src={artUrl(portraitPath(princess.id, princess.outfit))} width={76} height={76} alt="" />
        <span>{t(`princesses.${princess.id}`)}</span>
      </label>)}
    </fieldset>
    {interrupting && <p className={styles.travelWarning} role="note">{t('trip.cancelCare')}</p>}
    <p className={styles.saveNote}>{t('trip.free')}</p>
    <div className={styles.dialogActions}><button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={companions.length === 0} onClick={() => onDepart(destination, companions)}><Image src={artUrl('icons/travel.svg')} width={48} height={48} alt="" /><Image src={artUrl('icons/play.svg')} width={48} height={48} alt="" /><span>{t('trip.depart')}</span></button></div>
  </>;
}

export function ShopPanel({ shop, state, feedback, onCommand }: InventoryProps & { shop: ShopId }) {
  const t = useTranslations('princessMansion');
  const [preview, setPreview] = useState<CatalogItem | null>(null);
  const selected = state.princesses.find(princess => princess.id === state.selectedId);
  if (!selected) return <p role="alert">{t('errors.invalidAction')}</p>;
  return <>
    <div className={styles.shopWallet} aria-label={t('wallet', { count: state.coins })}><Image src={artUrl('icons/coin.svg')} width={28} height={28} alt="" /><strong>{state.coins}</strong><span>{t('coins')}</span></div>
    <p className={styles.dialogDescription}>{t('shopping.shopDescription')}</p>
    <ContextHelp topic="shopping" />
    {shop !== 'treats' && <p className={styles.collectionNote}>{t('shopping.shared')}</p>}
    {preview && <div className={styles.shopPreview} data-testid="shop-preview">
      {preview.shop === 'outfits' ? <Image src={artUrl(portraitPath(selected.id, preview.id))} width={148} height={148} alt={t(`princesses.${selected.id}`)} />
        : <Image className={styles.toyDemo} data-toy={preview.id} src={artUrl(`items/${preview.id}.svg`)} width={148} height={128} alt="" />}
      <div><strong>{t(`shopping.items.${preview.id}.name`)}</strong><p>{t('shopping.freePreview')}</p></div>
    </div>}
    <div className={styles.catalogGrid}>{shopItems(shop).map(item => {
      const owned = item.shop === 'outfits' ? state.inventory.outfits.includes(item.id) : item.shop === 'toys' ? state.inventory.toys.includes(item.id) : false;
      const quantity = item.shop === 'treats' ? state.inventory.treats[item.id] : 0;
      const full = item.shop === 'treats' && quantity >= MAX_TREATS;
      return <article key={item.id} className={styles.catalogCard} data-testid={`item-${item.id}`}>
        <Image src={artUrl(`items/${item.id}.svg`)} width={180} height={154} alt="" />
        <h3>{t(`shopping.items.${item.id}.name`)}</h3><p>{t(`shopping.items.${item.id}.description`)}</p>
        <div className={styles.itemPrice}><Image src={artUrl('icons/coin.svg')} width={20} height={20} alt="" />{item.price}</div>
        {item.shop === 'treats' && <small>{t('shopping.quantity', { count: quantity })}</small>}
        {item.shop !== 'treats' && <button type="button" className={styles.button} onClick={() => setPreview(item)}><Image src={artUrl(item.shop === 'outfits' ? portraitPath(selected.id, item.id) : 'icons/play.svg')} width={48} height={48} alt="" /><span>{t(item.shop === 'outfits' ? 'shopping.preview' : 'shopping.demo')}</span></button>}
        <button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={owned || full || state.coins < item.price} onClick={() => onCommand({ type: 'buy', itemId: item.id })}>
          <Image src={artUrl(`icons/${owned ? 'check' : 'cart'}.svg`)} width={48} height={48} alt="" /><span>{owned ? t('shopping.owned') : full ? t('shopping.full') : t('shopping.buy', { price: item.price })}</span>
        </button>
        {!owned && !full && state.coins < item.price && <small className={styles.priceHint}>{t('shopping.needCoins', { count: item.price - state.coins })}</small>}
        {owned && item.shop === 'outfits' && <button type="button" className={styles.button} disabled={selected.outfit === item.id} onClick={() => onCommand({ type: 'equip', id: selected.id, outfit: item.id })}><Image src={artUrl('icons/wardrobe.svg')} width={48} height={48} alt="" /><span>{t(selected.outfit === item.id ? 'shopping.worn' : 'shopping.wear')}</span></button>}
        {owned && item.shop === 'toys' && <button type="button" className={styles.button} disabled={selected.toy === item.id} onClick={() => onCommand({ type: 'toy', id: selected.id, toy: item.id })}><Image src={artUrl('icons/check.svg')} width={48} height={48} alt="" /><span>{t(selected.toy === item.id ? 'shopping.chosen' : 'shopping.chooseToy')}</span></button>}
        {item.shop === 'treats' && <button type="button" className={styles.button} disabled={quantity === 0} onClick={() => onCommand({ type: 'serve', id: selected.id, treat: item.id })}><Image src={artUrl(`items/${item.id}.svg`)} width={48} height={48} alt="" /><span>{t('shopping.serve')}</span></button>}
      </article>;
    })}</div>
    <p className={styles.panelFeedback} role="status">{feedback}</p>
  </>;
}

export function CollectionPanel({ kind, state, feedback, onCommand, onChoose }: InventoryProps & { kind: 'wardrobe' | 'toybox' | 'bag'; onChoose(kind: 'wardrobe' | 'toybox' | 'bag'): void }) {
  const t = useTranslations('princessMansion');
  const selected = state.princesses.find(princess => princess.id === state.selectedId);
  if (!selected) return <p role="alert">{t('errors.invalidAction')}</p>;
  const items = kind === 'wardrobe' ? CATALOG.filter(item => item.shop === 'outfits' && state.inventory.outfits.includes(item.id))
    : kind === 'toybox' ? CATALOG.filter(item => item.shop === 'toys' && state.inventory.toys.includes(item.id))
      : CATALOG.filter(item => item.shop === 'treats');
  return <>
    <div className={styles.collectionTabs} role="group" aria-label={t('shopping.shared')}>{(['wardrobe', 'toybox', 'bag'] as const).map(id => <button type="button" key={id} className={styles.pictureButton} aria-label={t(`shopping.${id}Title`)} title={t(`shopping.${id}Title`)} aria-pressed={kind === id} onClick={() => onChoose(id)}><Image src={artUrl(id === 'toybox' ? 'items/plush-dragon.svg' : `icons/${id}.svg`)} width={56} height={56} alt="" /></button>)}</div>
    <p className={styles.dialogDescription}>{t(`shopping.${kind}Description`, { name: t(`princesses.${selected.id}`) })}</p>
    <div className={styles.catalogGrid}>
      {kind !== 'bag' && <article className={styles.catalogCard}>
        <Image src={artUrl(kind === 'wardrobe' ? portraitPath(selected.id) : 'props/toys.svg')} width={180} height={154} alt="" />
        <h3>{t(kind === 'wardrobe' ? 'shopping.original' : 'shopping.blocks')}</h3>
        <button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={kind === 'wardrobe' ? selected.outfit === 'original' : selected.toy === 'blocks'} onClick={() => onCommand(kind === 'wardrobe' ? { type: 'equip', id: selected.id, outfit: 'original' } : { type: 'toy', id: selected.id, toy: 'blocks' })}>
          <Image src={artUrl(kind === 'wardrobe' ? 'icons/wardrobe.svg' : 'icons/check.svg')} width={48} height={48} alt="" /><span>{t(kind === 'wardrobe' ? selected.outfit === 'original' ? 'shopping.worn' : 'shopping.wear' : selected.toy === 'blocks' ? 'shopping.chosen' : 'shopping.chooseToy')}</span>
        </button>
      </article>}
      {items.map(item => <article className={styles.catalogCard} key={item.id} data-testid={`collection-${item.id}`}>
        <Image src={artUrl(`items/${item.id}.svg`)} width={180} height={154} alt="" />
        <h3>{t(`shopping.items.${item.id}.name`)}</h3><p>{t(`shopping.items.${item.id}.description`)}</p>
        {item.shop === 'outfits' ? <button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={selected.outfit === item.id} onClick={() => onCommand({ type: 'equip', id: selected.id, outfit: item.id })}><Image src={artUrl('icons/wardrobe.svg')} width={48} height={48} alt="" /><span>{t(selected.outfit === item.id ? 'shopping.worn' : 'shopping.wear')}</span></button>
          : item.shop === 'toys' ? <button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={selected.toy === item.id} onClick={() => onCommand({ type: 'toy', id: selected.id, toy: item.id })}><Image src={artUrl('icons/check.svg')} width={48} height={48} alt="" /><span>{t(selected.toy === item.id ? 'shopping.chosen' : 'shopping.chooseToy')}</span></button>
            : <><small>{t('shopping.quantity', { count: state.inventory.treats[item.id] })}</small><button type="button" className={`${styles.button} ${styles.primaryButton}`} disabled={state.inventory.treats[item.id] === 0} onClick={() => onCommand({ type: 'serve', id: selected.id, treat: item.id })}><Image src={artUrl(`items/${item.id}.svg`)} width={48} height={48} alt="" /><span>{t('shopping.serve')}</span></button></>}
      </article>)}
    </div>
    <p className={styles.panelFeedback} role="status">{feedback}</p>
  </>;
}

export function PotionPanel({ state, onCommand }: Pick<InventoryProps, 'state' | 'onCommand'>) {
  const t = useTranslations('princessMansion');
  const locale = useLocale();
  const [wrongChoice, setWrongChoice] = useState<IngredientId | null>(null);
  const selected = state.princesses.find(princess => princess.id === state.selectedId);
  const activity = selected?.activity;
  const lesson = activity?.kind === 'active' ? activity.potion : null;
  const recipe = lesson?.recipe ?? (activity?.kind === 'waiting' ? activity.recipe : null);
  const station = getStation(activity?.stationId);
  if (!selected || !activity || activity.source !== 'player' || !recipe || station?.activity !== 'potion') return null;
  const accepting = lesson?.stage === 'ingredients';
  const choosing = accepting || activity.kind === 'waiting';
  const next = RECIPES[recipe].ingredients[lesson?.ingredients.length ?? 0];
  return <section className={`${styles.lessonPanel} ${choosing ? '' : styles.brewingLesson}`} dir={locale === 'he' ? 'rtl' : 'ltr'} onKeyDown={event => event.stopPropagation()} aria-label={t('lesson.title')} data-testid="potion-lesson" data-stage={lesson?.stage ?? 'waiting'} data-side={station.x > 580 ? 'left' : 'right'}>
    <div className={styles.screenReaderOnly}><strong>{t('lesson.title')}</strong><span>{t('lesson.progress', { count: lesson?.ingredients.length ?? 0 })}</span></div>
    {choosing && <>
      <div className={styles.recipeChoices} aria-label={t('lesson.chooseRecipe')}>{RECIPE_IDS.map(id => <button type="button" className={`${styles.pictureButton} ${recipe === id ? styles.chosenRecipe : ''}`} key={id} data-testid={`recipe-${id}`} aria-label={t(`lesson.recipes.${id}`)} title={t(`lesson.recipes.${id}`)} aria-pressed={recipe === id} onClick={() => { if (onCommand({ type: 'recipe', id: selected.id, recipe: id })) setWrongChoice(null); }}>
        <Image src={artUrl(`icons/recipe-${id}.svg`)} width={56} height={56} alt="" />
      </button>)}</div>
      <ContextHelp topic="lessons" />
      <div className={styles.recipeTrail} dir="ltr" aria-label={t('lesson.progress', { count: lesson?.ingredients.length ?? 0 })}>{RECIPES[recipe].ingredients.map((id, index) => <span key={id} data-accepted={index < (lesson?.ingredients.length ?? 0)} data-next={accepting && index === lesson?.ingredients.length}>
        <Image src={artUrl(`icons/${id}.svg`)} width={56} height={56} alt={t(`lesson.ingredients.${id}`)} /><b aria-hidden="true">{index < (lesson?.ingredients.length ?? 0) ? '✓' : index + 1}</b>
        {index < 2 && <i aria-hidden="true">→</i>}
      </span>)}<Image src={artUrl('props/cauldron-back.svg')} width={48} height={48} alt="" /></div>
      <div className={styles.ingredientChoices}>{INGREDIENT_IDS.map(id => <button type="button" className={styles.ingredientButton} key={id} data-testid={`ingredient-${id}`} data-next={accepting && id === next} data-wrong={wrongChoice === id} aria-label={t(`lesson.ingredients.${id}`)} title={t(`lesson.ingredients.${id}`)} disabled={!accepting} onClick={() => { if (onCommand({ type: 'ingredient', id: selected.id, ingredient: id })) setWrongChoice(id === next ? null : id); }}>
        <Image src={artUrl(`icons/${id}.svg`)} width={48} height={48} alt="" />{wrongChoice === id && <span aria-hidden="true">×</span>}
      </button>)}</div>
    </>}
    {!choosing && <><div className={styles.brewPicture}><Image src={artUrl('props/cauldron-back.svg')} width={112} height={96} alt="" /><Image src={artUrl(`icons/${lesson?.stage === 'reveal' ? 'check' : 'recipe-' + recipe}.svg`)} width={56} height={56} alt="" /></div><div className={styles.needTrack} role="progressbar" aria-label={t('lesson.title')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={activity.kind === 'active' ? Math.round(activity.elapsed / activity.duration * 100) : 0}><div className={styles.needFill} style={{ width: `${activity.kind === 'active' ? activity.elapsed / activity.duration * 100 : 0}%` }} /></div></>}
    <p className={choosing ? styles.screenReaderOnly : styles.lessonHint} role="status">{activity.kind === 'waiting' ? t('waiting') : accepting ? t('lesson.nextIngredient', { ingredient: t(`lesson.ingredients.${next}`) }) : t(lesson?.stage === 'reveal' ? 'lesson.reveal' : 'lesson.mixing')}</p>
  </section>;
}
