// Shared types for the bowling mini-game.

export type GamePhase =
  | "setup" // choosing number of frames
  | "ready" // waiting for the player to aim/throw
  | "rolling" // ball is in motion, physics running
  | "settling" // ball stopped, waiting for pins to finish falling
  | "split-cue" // a split was left, showing the "bowl again" cue before ball 2
  | "video" // a meme clip is playing for the result of the last roll
  | "frame-done" // brief beat between frames
  | "game-over"; // final scoreboard

export interface Roll {
  frameIndex: number;
  ballIndex: number; // 0 = first ball, 1 = second, 2 = bonus (10th frame only)
  pinsDownThisRoll: number; // pins newly knocked down by this specific roll
  pinsStandingAfter: number; // pins still standing after this roll
  isStrike: boolean;
  isSpare: boolean;
  isSplit: boolean; // split leave (only meaningful on ball 0 of a frame)
  isGutter: boolean;
}

export interface FrameState {
  rolls: number[]; // raw pins-down values, flattened bowling-scoring style
  pinsKnockedMask: boolean[]; // which of the 10 pins are down going into next ball
  isComplete: boolean;
  cumulativeScore: number | null; // null until this frame (and its bonuses) can be scored
}

export interface VideoCue {
  src: string;
  label: string;
}

export interface PinDef {
  /** 1-10, standard bowling pin numbering */
  id: number;
  position: [number, number, number];
}