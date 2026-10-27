/** État opaque propre à un jeu ; Orbis ne connaît pas sa structure pédagogique. */
export type SaveRecord<TState> = {
  state: TState;
  formatVersion: number;
  updatedAt: string;
  revision: number;
};

export type OrbisError =
  | 'offline'
  | 'unauthorized'
  | 'invalid-data'
  | 'conflict'
  | 'storage-unavailable'
  | 'remote-unavailable';

export type OrbisResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: OrbisError; message?: string };

/** Interface optionnelle préparée pour l’intégration progressive des jeux. */
export interface GameProgressService<TState> {
  loadProgress(): Promise<OrbisResult<SaveRecord<TState> | null>>;
  saveProgress(state: TState, formatVersion: number): Promise<OrbisResult<SaveRecord<TState>>>;
}
