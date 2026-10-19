import type { Unit } from './types';

export function ResourceBars({ unit, healthLabel, energyLabel, numbers = false }: {
  unit: Pick<Unit, 'hp' | 'maxHp' | 'energy' | 'maxEnergy'>;
  healthLabel: string;
  energyLabel: string;
  numbers?: boolean;
}) {
  return <div className={`pt-resource-bars ${numbers ? 'with-numbers' : ''} ${unit.hp === 0 ? 'knocked-out' : ''}`}>
    <div className="pt-health-bar" role="progressbar" aria-label={healthLabel} aria-valuemin={0} aria-valuemax={unit.maxHp} aria-valuenow={unit.hp}>
      <i style={{ width: `${unit.hp / unit.maxHp * 100}%` }} />{numbers && <span>{unit.hp}/{unit.maxHp}</span>}
    </div>
    <div className="pt-energy-bar" role="progressbar" aria-label={energyLabel} aria-valuemin={0} aria-valuemax={unit.maxEnergy} aria-valuenow={unit.energy}>
      <i style={{ width: `${unit.energy / unit.maxEnergy * 100}%` }} />{numbers && <span>{unit.energy}/{unit.maxEnergy}</span>}
    </div>
  </div>;
}
