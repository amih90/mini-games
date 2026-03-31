"use client";

import { useCallback } from "react";
import { Tank } from "../types";

interface UseDragMergeOptions {
  playerTanks: Tank[];
  selectedTankId: string | null;
  pendingTankType: string | null;
  onSelectTank: (id: string | null) => void;
  onPlaceTank: (col: number, row: number) => void;
  onMoveTank: (id: string, col: number, row: number) => void;
  onMergeTanks: (sourceId: string, targetId: string) => void;
}

/**
 * Handles click/tap interactions for grid merge mechanics.
 * Implements a two-tap select-then-act model that works for
 * both mouse and touch input.
 */
export function useDragMerge({
  playerTanks,
  selectedTankId,
  pendingTankType,
  onSelectTank,
  onPlaceTank,
  onMoveTank,
  onMergeTanks,
}: UseDragMergeOptions) {
  /** Called when a player grid cell is tapped */
  const handleCellClick = useCallback(
    (col: number, row: number) => {
      const tankHere =
        playerTanks.find((t) => t.col === col && t.row === row && t.isAlive) ??
        null;

      // 1. Pending tank from shop → place on empty cell
      if (pendingTankType) {
        if (!tankHere) onPlaceTank(col, row);
        return;
      }

      // 2. Selected tank → move or deselect
      if (selectedTankId) {
        if (!tankHere) {
          onMoveTank(selectedTankId, col, row);
        } else if (tankHere.id === selectedTankId) {
          onSelectTank(null); // deselect
        }
        // Clicking a different tank while one is selected → handled by handleTankClick
        return;
      }

      // 3. No selection, empty cell → nothing
    },
    [
      playerTanks,
      pendingTankType,
      selectedTankId,
      onPlaceTank,
      onMoveTank,
      onSelectTank,
    ],
  );

  /** Called when a tank mesh is tapped */
  const handleTankClick = useCallback(
    (id: string) => {
      const tank = playerTanks.find((t) => t.id === id);
      if (!tank || !tank.isAlive) return;

      // If a tank is already selected and we click another tank of same type+level → merge
      if (selectedTankId && selectedTankId !== id) {
        const selected = playerTanks.find((t) => t.id === selectedTankId);
        if (
          selected &&
          selected.type === tank.type &&
          selected.level === tank.level &&
          selected.level < 5
        ) {
          onMergeTanks(selectedTankId, id);
          return;
        }
      }

      // Otherwise just select it
      onSelectTank(id === selectedTankId ? null : id);
    },
    [playerTanks, selectedTankId, onSelectTank, onMergeTanks],
  );

  return { handleCellClick, handleTankClick };
}
