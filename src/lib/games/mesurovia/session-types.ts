/** Contrats de séance Mesurovia, utilisés par la page et son catalogue. */
import type { MemoryCard } from './memory-game';
import type { ResponseDetail } from '$lib/orbis/results/contract';

export type SessionMode = 'practice' | 'battle' | 'table' | 'detective' | 'clock' | 'builder' | 'memory' | 'race' | 'exam' | 'boss' | 'pretest';
export type Feedback = { kind: 'success' | 'hint' | 'worked' | 'notice'; title: string; text: string } | null;
export type Session = {
    mode: SessionMode;
    questions: any[];
    index: number;
    correct: number;
    firstTryCorrect: number;
    wrong: number;
    attempts: number;
    helped: boolean;
    answerStatus: 'correct' | 'wrong' | null;
    selected: string;
    typed: string;
    tableComplete: boolean;
    tableCommaCorrect: boolean;
    tablePlacementCorrect: boolean;
    tableResult: string;
    selectedMany: string[];
    matches: Record<string, string>;
    matchingLeft: string;
    orderedItems: string[];
    gameEvent: 'player-attack' | 'enemy-attack' | 'success' | 'miss' | 'race-move' | null;
    playerHp: number;
    enemyHp: number;
    raceSteps: number;
    rivalSteps: number;
    raceRoll: number;
    memoryCards: MemoryCard[];
    memoryOpenIds: string[];
    memoryMoves: number;
    familyResults: Record<string, { total: number; correct: number }>;
    responseDetails: ResponseDetail[];
  };

