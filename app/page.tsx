'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Face = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type Axis = 'x' | 'y' | 'z';
type Vector = [number, number, number];
type Phase = 'idle' | 'holding' | 'ready' | 'running' | 'stopped';
type InputKind = 'keyboard' | 'pointer';

type Sticker = {
  color: string;
  normal: Vector;
  position: Vector;
};

const HOLD_DURATION = 500;
const FACE_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];
const FACE_COLORS: Record<Face, string> = {
  U: '#f5cf45',
  D: '#f4f2eb',
  F: '#f0803c',
  B: '#dc4d4d',
  R: '#4777d6',
  L: '#42a873',
};

const MOVE_CONFIG: Record<Face, { axis: Axis; layer: number }> = {
  R: { axis: 'x', layer: 1 },
  L: { axis: 'x', layer: -1 },
  U: { axis: 'y', layer: 1 },
  D: { axis: 'y', layer: -1 },
  F: { axis: 'z', layer: 1 },
  B: { axis: 'z', layer: -1 },
};

const AXIS_FACES: Face[][] = [
  ['U', 'D'],
  ['L', 'R'],
  ['F', 'B'],
];

function randomIndex(max: number) {
  if (typeof crypto !== 'undefined') {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function generateScramble() {
  const modifiers = ['', "'", '2'];
  const length = 19 + randomIndex(4);
  const moves: string[] = [];
  let previousAxis = -1;

  for (let index = 0; index < length; index += 1) {
    const availableAxes = [0, 1, 2].filter((axis) => axis !== previousAxis);
    const axis = availableAxes[randomIndex(availableAxes.length)];
    const face = AXIS_FACES[axis][randomIndex(2)];
    const modifier = modifiers[randomIndex(modifiers.length)];
    moves.push(`${face}${modifier}`);
    previousAxis = axis;
  }

  return moves;
}

function createSolvedCube() {
  const stickers: Sticker[] = [];

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const x = column - 1;
      const y = 1 - row;
      const z = row - 1;

      stickers.push({
        color: FACE_COLORS.U,
        normal: [0, 1, 0],
        position: [x, 1, z],
      });
      stickers.push({
        color: FACE_COLORS.D,
        normal: [0, -1, 0],
        position: [x, -1, -z],
      });
      stickers.push({
        color: FACE_COLORS.F,
        normal: [0, 0, 1],
        position: [x, y, 1],
      });
      stickers.push({
        color: FACE_COLORS.B,
        normal: [0, 0, -1],
        position: [-x, y, -1],
      });
      stickers.push({
        color: FACE_COLORS.R,
        normal: [1, 0, 0],
        position: [1, y, -x],
      });
      stickers.push({
        color: FACE_COLORS.L,
        normal: [-1, 0, 0],
        position: [-1, y, x],
      });
    }
  }

  return stickers;
}

function rotateVector(
  [x, y, z]: Vector,
  axis: Axis,
  direction: number,
): Vector {
  if (axis === 'x') return direction === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === 'y') return direction === 1 ? [z, y, -x] : [-z, y, x];
  return direction === 1 ? [-y, x, z] : [y, -x, z];
}

function applyMove(stickers: Sticker[], move: string) {
  const face = move[0] as Face;
  const { axis, layer } = MOVE_CONFIG[face];
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const turns = move.endsWith('2') ? 2 : 1;
  const direction = -layer * (move.endsWith("'") ? -1 : 1);
  let result = stickers;

  for (let turn = 0; turn < turns; turn += 1) {
    result = result.map((sticker) => {
      if (sticker.position[axisIndex] !== layer) return sticker;

      return {
        ...sticker,
        normal: rotateVector(sticker.normal, axis, direction),
        position: rotateVector(sticker.position, axis, direction),
      };
    });
  }

  return result;
}

function getFaceGrid(stickers: Sticker[], face: Face) {
  const normalByFace: Record<Face, Vector> = {
    U: [0, 1, 0],
    D: [0, -1, 0],
    F: [0, 0, 1],
    B: [0, 0, -1],
    R: [1, 0, 0],
    L: [-1, 0, 0],
  };
  const targetNormal = normalByFace[face];
  const grid = Array<string>(9);

  stickers.forEach((sticker) => {
    if (!sticker.normal.every((value, index) => value === targetNormal[index]))
      return;

    const [x, y, z] = sticker.position;
    let row = 0;
    let column = 0;

    if (face === 'U') [row, column] = [z + 1, x + 1];
    if (face === 'D') [row, column] = [1 - z, x + 1];
    if (face === 'F') [row, column] = [1 - y, x + 1];
    if (face === 'B') [row, column] = [1 - y, 1 - x];
    if (face === 'R') [row, column] = [1 - y, 1 - z];
    if (face === 'L') [row, column] = [1 - y, z + 1];
    grid[row * 3 + column] = sticker.color;
  });

  return grid;
}

function formatTime(milliseconds: number) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}

function CubeNet({ scramble }: { scramble: string[] }) {
  const faces = useMemo(() => {
    const cube = scramble.reduce(applyMove, createSolvedCube());
    return Object.fromEntries(
      FACE_ORDER.map((face) => [face, getFaceGrid(cube, face)]),
    ) as Record<Face, string[]>;
  }, [scramble]);

  return (
    <figure
      className="cube-net"
      aria-label="All six faces after applying the scramble"
    >
      {FACE_ORDER.map((face) => (
        <div
          className={`cube-face face-${face.toLowerCase()}`}
          key={face}
          aria-label={`${face} face`}
        >
          {faces[face].map((color, index) => (
            <span
              className="sticker"
              style={{ backgroundColor: color }}
              key={index}
            />
          ))}
        </div>
      ))}
    </figure>
  );
}

export default function Home() {
  const [scramble, setScramble] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const phaseRef = useRef<Phase>('idle');
  const restingPhaseRef = useRef<Phase>('idle');
  const activeInputRef = useRef<InputKind | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const updatePhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    const initialScramble = window.setTimeout(
      () => setScramble(generateScramble()),
      0,
    );
    return () => window.clearTimeout(initialScramble);
  }, []);

  const stopTimer = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const finalTime = performance.now() - startTimeRef.current;
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setElapsed(finalTime);
    updatePhase('stopped');
    activeInputRef.current = null;
    setScramble(generateScramble());
  }, [updatePhase]);

  const startTimer = useCallback(() => {
    activeInputRef.current = null;
    startTimeRef.current = performance.now();
    setElapsed(0);
    updatePhase('running');
    intervalRef.current = setInterval(() => {
      setElapsed(performance.now() - startTimeRef.current);
    }, 10);
  }, [updatePhase]);

  const beginHold = useCallback(
    (input: InputKind) => {
      if (phaseRef.current === 'running') {
        stopTimer();
        return;
      }
      if (phaseRef.current === 'holding' || phaseRef.current === 'ready')
        return;

      restingPhaseRef.current = phaseRef.current;
      activeInputRef.current = input;
      updatePhase('holding');
      holdTimeoutRef.current = setTimeout(
        () => updatePhase('ready'),
        HOLD_DURATION,
      );
    },
    [stopTimer, updatePhase],
  );

  const releaseHold = useCallback(
    (input: InputKind) => {
      if (activeInputRef.current !== input) return;
      if (holdTimeoutRef.current !== null) clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
      activeInputRef.current = null;

      if (phaseRef.current === 'ready') startTimer();
      else if (phaseRef.current === 'holding')
        updatePhase(restingPhaseRef.current);
    },
    [startTimer, updatePhase],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      if (event.repeat) return;
      beginHold('keyboard');
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      releaseHold('keyboard');
    };
    const handleBlur = () => releaseHold(activeInputRef.current ?? 'keyboard');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      if (holdTimeoutRef.current !== null) clearTimeout(holdTimeoutRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [beginHold, releaseHold]);

  const desktopInstruction =
    phase === 'holding'
      ? 'Keep holding'
      : phase === 'ready'
        ? 'Release to start'
        : phase === 'running'
          ? 'Press Space or click anywhere to stop'
          : 'Hold Space or press and hold anywhere to start';

  const touchInstruction =
    phase === 'holding'
      ? 'Keep holding'
      : phase === 'ready'
        ? 'Release to start'
        : phase === 'running'
          ? 'Tap anywhere to stop'
          : 'Touch and hold anywhere to start';

  return (
    <main
      className="timer-shell"
      data-phase={phase}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        beginHold('pointer');
      }}
      onPointerUp={(event) => {
        if (event.button !== 0) return;
        releaseHold('pointer');
      }}
      onPointerCancel={() => releaseHold('pointer')}
    >
      <header className="scramble-area">
        <p className="eyebrow">3×3 SCRAMBLE</p>
        <h1>
          {scramble.length > 0 ? scramble.join(' ') : 'Generating scramble…'}
        </h1>
      </header>

      <section className="timer-area" aria-label="Cube timer">
        <output className="time" aria-live="off">
          {formatTime(elapsed)}
        </output>
        <p className="instruction">
          <span className="instruction-desktop">{desktopInstruction}</span>
          <span className="instruction-touch">{touchInstruction}</span>
        </p>
      </section>

      <CubeNet scramble={scramble} />
    </main>
  );
}
