// Sesi login (klaim JWT). Token aslinya ada di cookie (src/core/token.ts); store ini hanya
// cermin yang reaktif untuk UI. `ready` = cookie sudah dibaca di klien (hindari hydration mismatch).

import type { TokenClaims } from 'src/models/auth';

import { create } from 'zustand';

import { getToken, clearTokens, decodeToken } from 'src/core/token';

interface SessionState {
  ready: boolean;
  claims: TokenClaims | null;
  /** baca ulang cookie → klaim */
  sync: () => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  ready: false,
  claims: null,
  sync: () => set({ ready: true, claims: decodeToken(getToken()) }),
  clear: () => {
    clearTokens();
    set({ ready: true, claims: null });
  },
}));
