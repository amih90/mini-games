import Phaser from 'phaser';
import {
  BoardState, Move,
  createInitialBoard, rollDice as rollDiceLogic,
  getPossibleMoves, applyMove, pickAIMove,
} from './backgammonLogic';
import { loadWins, incrementWins } from '../shared/phaser/gameUtils';

/* ------------------------------------------------------------------ */
/*  Translations                                                      */
/* ------------------------------------------------------------------ */

const T: Record<string, Record<string, string>> = {
  en: {
    title: 'Backgammon',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    rollDice: 'Roll Dice',
    yourTurn: 'Your turn',
    aiTurn: 'AI thinking…',
    youWon: 'You Won!',
    youLost: 'You Lost',
    playAgain: 'Play Again',
    wins: 'Wins',
    moves: 'Moves',
    white: 'White',
    black: 'Black',
    bar: 'Bar',
    off: 'Off',
    noMoves: 'No valid moves',
  },
  he: {
    title: 'שש בש',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    rollDice: 'הטל קוביות',
    yourTurn: 'התור שלך',
    aiTurn: 'המחשב חושב…',
    youWon: '!ניצחת',
    youLost: 'הפסדת',
    playAgain: 'שחק שוב',
    wins: 'ניצחונות',
    moves: 'מהלכים',
    white: 'לבן',
    black: 'שחור',
    bar: 'בר',
    off: 'חוץ',
    noMoves: 'אין מהלכים',
  },
  zh: {
    title: '双陆棋',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    rollDice: '掷骰子',
    yourTurn: '你的回合',
    aiTurn: 'AI思考中…',
    youWon: '你赢了！',
    youLost: '你输了',
    playAgain: '再玩一次',
    wins: '胜场',
    moves: '步数',
    white: '白',
    black: '黑',
    bar: '中间',
    off: '出局',
    noMoves: '无可用步骤',
  },
  es: {
    title: 'Backgammon',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    rollDice: 'Tirar dados',
    yourTurn: 'Tu turno',
    aiTurn: 'IA pensando…',
    youWon: '¡Ganaste!',
    youLost: 'Perdiste',
    playAgain: 'Jugar de nuevo',
    wins: 'Victorias',
    moves: 'Movimientos',
    white: 'Blanco',
    black: 'Negro',
    bar: 'Barra',
    off: 'Fuera',
    noMoves: 'Sin movimientos',
  },
};

function t(locale: string, key: string): string {
  return T[locale]?.[key] ?? T['en'][key] ?? key;
}

/* ------------------------------------------------------------------ */
/*  Layout constants                                                  */
/* ------------------------------------------------------------------ */

const W = 700;
const H = 500;
const BOARD_X = 50;
const BOARD_Y = 50;
const BOARD_W = 600;
const BOARD_H = 400;
const POINT_W = BOARD_W / 13; // 13 columns (12 points + bar)
const TRI_H = 160;
const CHECKER_R = 16;
const WINS_KEY = 'backgammon-phaser-wins';

type Difficulty = 'easy' | 'medium' | 'hard';

/* ------------------------------------------------------------------ */
/*  Menu Scene                                                        */
/* ------------------------------------------------------------------ */

export class BGMenuScene extends Phaser.Scene {
  private locale!: string;

  constructor() {
    super({ key: 'BGMenuScene' });
  }

  init(data: { locale?: string }) {
    this.locale = data.locale || 'en';
  }

  create() {
    const cx = W / 2;
    this.cameras.main.setBackgroundColor('#3e2723');

    this.add.text(cx, 50, t(this.locale, 'title'), {
      fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold',
      color: '#ffe0b2', stroke: '#5d4037', strokeThickness: 4,
    }).setOrigin(0.5);

    const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
    const colors = [0x4caf50, 0xff9800, 0xf44336];

    diffs.forEach((d, i) => {
      const y = 150 + i * 80;
      const bg = this.add.rectangle(cx, y, 260, 56, colors[i], 0.9)
        .setStrokeStyle(3, 0xffe0b2).setInteractive({ useHandCursor: true });
      this.add.text(cx, y, t(this.locale, d), {
        fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff',
      }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setScale(1.08));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => {
        this.scene.start('BGBoardScene', { difficulty: d, locale: this.locale });
      });
    });

    const wins = loadWins(WINS_KEY);
    if (wins > 0) {
      this.add.text(cx, 420, `${t(this.locale, 'wins')}: ${wins}`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffe0b2',
      }).setOrigin(0.5);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Board Scene                                                       */
/* ------------------------------------------------------------------ */

export class BGBoardScene extends Phaser.Scene {
  private locale!: string;
  private difficulty!: Difficulty;
  private state!: BoardState;
  private boardGfx!: Phaser.GameObjects.Graphics;
  private selectedPoint: number | null = null;
  private validMoves: Move[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private diceText!: Phaser.GameObjects.Text;
  private rollBtn!: Phaser.GameObjects.Rectangle;
  private rollBtnText!: Phaser.GameObjects.Text;
  private moveCountText!: Phaser.GameObjects.Text;
  private barTexts!: { white: Phaser.GameObjects.Text; black: Phaser.GameObjects.Text };
  private offTexts!: { white: Phaser.GameObjects.Text; black: Phaser.GameObjects.Text };
  private highlightGfx!: Phaser.GameObjects.Graphics;
  private resultShown = false;

  constructor() {
    super({ key: 'BGBoardScene' });
  }

  init(data: { difficulty: Difficulty; locale: string }) {
    this.difficulty = data.difficulty;
    this.locale = data.locale || 'en';
    this.state = createInitialBoard();
    this.selectedPoint = null;
    this.validMoves = [];
    this.resultShown = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#5d4037');

    this.boardGfx = this.add.graphics();
    this.highlightGfx = this.add.graphics().setDepth(1);

    this.drawBoard();

    // HUD
    this.statusText = this.add.text(W / 2, 15, t(this.locale, 'yourTurn'), {
      fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold',
      color: '#ffe0b2',
    }).setOrigin(0.5);

    this.diceText = this.add.text(W / 2, 35, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    this.moveCountText = this.add.text(10, H - 20, `${t(this.locale, 'moves')}: 0`, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#bcaaa4',
    });

    // Bar / Off indicators
    this.barTexts = {
      white: this.add.text(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H + 5, '', {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff',
      }).setOrigin(0.5, 0),
      black: this.add.text(BOARD_X + BOARD_W / 2, BOARD_Y - 18, '', {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#aaaaaa',
      }).setOrigin(0.5, 0),
    };
    this.offTexts = {
      white: this.add.text(BOARD_X + BOARD_W + 15, BOARD_Y + BOARD_H - 20, '', {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff',
      }),
      black: this.add.text(BOARD_X + BOARD_W + 15, BOARD_Y + 5, '', {
        fontFamily: 'sans-serif', fontSize: '12px', color: '#aaaaaa',
      }),
    };

    this.drawCheckers();

    // Roll button
    this.rollBtn = this.add.rectangle(W / 2, BOARD_Y + BOARD_H / 2, 100, 40, 0x795548, 1)
      .setStrokeStyle(2, 0xffe0b2).setInteractive({ useHandCursor: true }).setDepth(5);
    this.rollBtnText = this.add.text(W / 2, BOARD_Y + BOARD_H / 2, t(this.locale, 'rollDice'), {
      fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffe0b2',
    }).setOrigin(0.5).setDepth(6);

    this.rollBtn.on('pointerdown', () => this.onRollDice());

    // Board click
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      if (this.state.currentPlayer !== 'white' || !this.state.dice) return;
      const pt = this.getPointAtPointer(_pointer);
      if (pt !== null) this.onPointClick(pt);
    });

    // Keyboard
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.onRollDice());
    }

    this.updateHUD();
  }

  /* ---------- drawing ---------- */

  private drawBoard() {
    const g = this.boardGfx;
    g.clear();

    // Board background
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

    // Border
    g.lineStyle(3, 0x3e2723, 1);
    g.strokeRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);

    // Triangles
    for (let i = 0; i < 24; i++) {
      this.drawTriangle(g, i);
    }

    // Bar column
    const barX = BOARD_X + 6 * POINT_W;
    g.fillStyle(0x5d4037, 1);
    g.fillRect(barX, BOARD_Y, POINT_W, BOARD_H);
  }

  private drawTriangle(g: Phaser.GameObjects.Graphics, index: number) {
    const { x, y, dir } = this.getTrianglePos(index);
    const color = index % 2 === 0 ? 0xd7ccc8 : 0x4e342e;
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + POINT_W, y);
    g.lineTo(x + POINT_W / 2, y + TRI_H * dir);
    g.closePath();
    g.fill();
  }

  private getTrianglePos(index: number): { x: number; y: number; dir: number } {
    // Bottom row: points 0-11 (right to left for 0-5, then 7-12 skip bar)
    // Top row: points 12-23 (left to right for 12-17, then 19-23 skip bar)
    let col: number;
    let dir: number;

    if (index < 6) {
      // Bottom right (points 0–5)
      col = 12 - index; // columns 12,11,10,9,8,7
      dir = -1; // triangle points up from bottom
    } else if (index < 12) {
      // Bottom left (points 6–11)
      col = 11 - index; // columns 5,4,3,2,1,0
      dir = -1;
    } else if (index < 18) {
      // Top left (points 12–17)
      col = index - 12; // columns 0,1,2,3,4,5
      dir = 1; // triangle points down from top
    } else {
      // Top right (points 18–23)
      col = index - 12 + 1; // columns 7,8,9,10,11,12  (skip bar col 6)
      dir = 1;
    }

    // Adjust for bar gap: columns >= 6 shift right by POINT_W (bar column)
    const x = BOARD_X + col * POINT_W;
    const y = dir === -1 ? BOARD_Y + BOARD_H : BOARD_Y;

    return { x, y, dir };
  }

  private getCheckerXY(index: number, stackIdx: number): { cx: number; cy: number } {
    const { x, dir } = this.getTrianglePos(index);
    const cx = x + POINT_W / 2;
    const spacing = Math.min(CHECKER_R * 2 + 2, TRI_H / 6);
    const cy = dir === -1
      ? BOARD_Y + BOARD_H - CHECKER_R - 4 - stackIdx * spacing
      : BOARD_Y + CHECKER_R + 4 + stackIdx * spacing;
    return { cx, cy };
  }

  private drawCheckers() {
    // Remove old checker graphics (we'll redraw fresh)
    this.children.list
      .filter(c => c.getData('checker'))
      .forEach(c => c.destroy());

    const { points, bar, bornOff } = this.state;

    for (let i = 0; i < 24; i++) {
      const count = points[i].checkers;
      const abs = Math.abs(count);
      const isWhite = count > 0;

      for (let s = 0; s < abs; s++) {
        const { cx, cy } = this.getCheckerXY(i, s);
        this.drawOneChecker(cx, cy, isWhite, i === this.selectedPoint && isWhite);
      }
    }

    // Bar checkers
    const barX = BOARD_X + 6 * POINT_W + POINT_W / 2;
    for (let s = 0; s < bar.white; s++) {
      this.drawOneChecker(barX, BOARD_Y + BOARD_H - 20 - s * 22, true, false);
    }
    for (let s = 0; s < bar.black; s++) {
      this.drawOneChecker(barX, BOARD_Y + 20 + s * 22, false, false);
    }

    // Highlights for valid moves
    this.highlightGfx.clear();
    for (const m of this.validMoves) {
      if (m.to === -2) continue; // bear-off — no highlight on board
      const { cx, cy } = this.getCheckerXY(m.to, Math.abs(points[m.to].checkers));
      this.highlightGfx.lineStyle(3, 0x76ff03, 0.9);
      this.highlightGfx.strokeCircle(cx, cy, CHECKER_R + 3);
    }

    // Update labels
    this.barTexts.white.setText(bar.white > 0 ? `${t(this.locale, 'bar')}: ${bar.white}` : '');
    this.barTexts.black.setText(bar.black > 0 ? `${t(this.locale, 'bar')}: ${bar.black}` : '');
    this.offTexts.white.setText(bornOff.white > 0 ? `${t(this.locale, 'off')}: ${bornOff.white}` : '');
    this.offTexts.black.setText(bornOff.black > 0 ? `${t(this.locale, 'off')}: ${bornOff.black}` : '');
  }

  private drawOneChecker(cx: number, cy: number, isWhite: boolean, selected: boolean) {
    const g = this.add.graphics().setData('checker', true).setDepth(2);
    g.fillStyle(isWhite ? 0xfafafa : 0x333333, 1);
    g.fillCircle(cx, cy, CHECKER_R);
    g.lineStyle(2, isWhite ? 0xbdbdbd : 0x111111, 1);
    g.strokeCircle(cx, cy, CHECKER_R);
    if (selected) {
      g.lineStyle(3, 0xffee00, 1);
      g.strokeCircle(cx, cy, CHECKER_R + 2);
    }
  }

  /* ---------- interaction ---------- */

  private getPointAtPointer(pointer: Phaser.Input.Pointer): number | null {
    const px = pointer.x;
    const py = pointer.y;

    for (let i = 0; i < 24; i++) {
      const { x, y, dir } = this.getTrianglePos(i);
      const left = x;
      const right = x + POINT_W;
      let top: number, bottom: number;
      if (dir === -1) {
        top = BOARD_Y + BOARD_H - TRI_H;
        bottom = BOARD_Y + BOARD_H;
      } else {
        top = BOARD_Y;
        bottom = BOARD_Y + TRI_H;
      }
      if (px >= left && px <= right && py >= top && py <= bottom) return i;
    }
    return null;
  }

  private onPointClick(pointIndex: number) {
    if (this.state.gameOver || this.state.currentPlayer !== 'white' || !this.state.dice) return;

    // If we already have a selected point, try to make the move
    if (this.selectedPoint !== null) {
      const move = this.validMoves.find(m => m.to === pointIndex);
      if (move) {
        this.executeMove(move);
        return;
      }
    }

    // Select a new source point
    if (this.state.points[pointIndex].checkers > 0) {
      this.selectedPoint = pointIndex;
      const allMoves = getPossibleMoves(this.state, 'white');
      this.validMoves = allMoves.filter(m => m.from === pointIndex);
      this.drawCheckers();
    }
  }

  private onRollDice() {
    if (this.state.dice || this.state.gameOver || this.state.currentPlayer !== 'white') return;

    const dice = rollDiceLogic();
    this.state = { ...this.state, dice };
    this.updateHUD();

    // Check if player has any moves
    const moves = getPossibleMoves(this.state, 'white');
    if (moves.length === 0) {
      this.statusText.setText(t(this.locale, 'noMoves'));
      this.time.delayedCall(1200, () => this.endTurn());
    }
  }

  private executeMove(move: Move) {
    this.state = applyMove(this.state, move);
    this.selectedPoint = null;
    this.validMoves = [];
    this.drawCheckers();
    this.updateHUD();

    if (this.state.gameOver) {
      this.showResult();
      return;
    }

    // If dice exhausted, turn switches in applyMove
    if (!this.state.dice) {
      this.endTurn();
      return;
    }

    // Check remaining moves for white
    if (this.state.currentPlayer === 'white') {
      const moves = getPossibleMoves(this.state, 'white');
      if (moves.length === 0) {
        this.statusText.setText(t(this.locale, 'noMoves'));
        this.time.delayedCall(800, () => this.endTurn());
      }
    }
  }

  private endTurn() {
    // Force switch to AI
    if (this.state.currentPlayer === 'white') {
      this.state = { ...this.state, currentPlayer: 'black', dice: null };
    }
    this.selectedPoint = null;
    this.validMoves = [];
    this.drawCheckers();
    this.updateHUD();
    this.time.delayedCall(600, () => this.aiTurn());
  }

  /* ---------- AI ---------- */

  private aiTurn() {
    if (this.state.gameOver || this.state.currentPlayer !== 'black') return;

    this.statusText.setText(t(this.locale, 'aiTurn'));

    // Roll dice for AI
    const dice = rollDiceLogic();
    this.state = { ...this.state, dice };
    this.updateHUD();

    this.doAIMove();
  }

  private doAIMove() {
    if (this.state.gameOver) { this.showResult(); return; }
    if (this.state.currentPlayer !== 'black' || !this.state.dice) {
      // AI turn over
      this.state = { ...this.state, currentPlayer: 'white', dice: null };
      this.updateHUD();
      this.drawCheckers();
      return;
    }

    const moves = getPossibleMoves(this.state, 'black');
    if (moves.length === 0) {
      // No moves, end AI turn
      this.state = { ...this.state, currentPlayer: 'white', dice: null };
      this.updateHUD();
      this.drawCheckers();
      return;
    }

    const move = pickAIMove(this.state);
    if (!move) {
      this.state = { ...this.state, currentPlayer: 'white', dice: null };
      this.updateHUD();
      this.drawCheckers();
      return;
    }

    // Delay between AI moves for visual effect
    const delay = this.difficulty === 'easy' ? 600 : this.difficulty === 'medium' ? 400 : 250;

    this.time.delayedCall(delay, () => {
      this.state = applyMove(this.state, move);
      this.drawCheckers();
      this.updateHUD();

      if (this.state.gameOver) {
        this.showResult();
        return;
      }

      // Continue AI moves if dice remaining
      if (this.state.dice && this.state.currentPlayer === 'black') {
        this.doAIMove();
      } else {
        // Turn over
        if (this.state.currentPlayer === 'black') {
          this.state = { ...this.state, currentPlayer: 'white', dice: null };
        }
        this.updateHUD();
        this.drawCheckers();
      }
    });
  }

  /* ---------- HUD ---------- */

  private updateHUD() {
    const isPlayerTurn = this.state.currentPlayer === 'white';
    this.statusText.setText(
      this.state.gameOver ? '' : isPlayerTurn ? t(this.locale, 'yourTurn') : t(this.locale, 'aiTurn'),
    );

    if (this.state.dice) {
      const d = this.state.dice;
      const remaining = d.remaining.join(', ');
      this.diceText.setText(`🎲 [${d.die1}] [${d.die2}]  ${remaining ? `(${remaining})` : ''}`);
    } else {
      this.diceText.setText('');
    }

    // Show/hide roll button
    const showRoll = isPlayerTurn && !this.state.dice && !this.state.gameOver;
    this.rollBtn.setVisible(showRoll);
    this.rollBtnText.setVisible(showRoll);

    this.moveCountText.setText(`${t(this.locale, 'moves')}: ${this.state.moveCount}`);
  }

  /* ---------- result ---------- */

  private showResult() {
    if (this.resultShown) return;
    this.resultShown = true;

    const won = this.state.winner === 'white';
    if (won) incrementWins(WINS_KEY);

    // Overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(20);

    this.add.text(W / 2, H / 2 - 60, won ? t(this.locale, 'youWon') : t(this.locale, 'youLost'), {
      fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold',
      color: won ? '#ffee00' : '#ff6666',
      stroke: '#222', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);

    this.add.text(W / 2, H / 2 - 10, `${t(this.locale, 'moves')}: ${this.state.moveCount}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(21);

    if (won) {
      const w = loadWins(WINS_KEY);
      this.add.text(W / 2, H / 2 + 25, `🏆 ${t(this.locale, 'wins')}: ${w}`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffdd00',
      }).setOrigin(0.5).setDepth(21);
    }

    const btn = this.add.rectangle(W / 2, H / 2 + 80, 220, 52, 0x4caf50, 1)
      .setStrokeStyle(3, 0xffffff).setDepth(21).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H / 2 + 80, t(this.locale, 'playAgain'), {
      fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(22);

    btn.on('pointerover', () => btn.setFillStyle(0x66bb6a));
    btn.on('pointerout', () => btn.setFillStyle(0x4caf50));
    btn.on('pointerdown', () => {
      this.scene.start('BGMenuScene', { locale: this.locale });
    });
  }
}
