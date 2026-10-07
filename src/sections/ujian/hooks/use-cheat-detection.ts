'use client';

// Deteksi kecurangan — port dari src/sections/_global/hooks/useCheatDetection.ts fe-solutest.
// Pelanggaran ke-1: peringatan · ke-2: jawaban dikosongkan · ke-N (maks): dikumpulkan otomatis.
// Tablet/iPad mendapat toleransi +1 dan grace period fullscreen untuk mengurangi false positive.

import { useRef, useState, useEffect, useEffectEvent } from 'react';

interface Options {
  onResetAnswers: () => void;
  onSubmitAnswers: () => void;
  onViolation?: (reason: string, count: number) => void;
  isCheatDetectionActive?: boolean;
  maxViolations?: number;
  /** false selama dialog lain (waktu habis / submit) agar tidak dobel */
  enabled?: boolean;
}

const isTabletLikeDevice = () =>
  typeof navigator !== 'undefined' &&
  ((navigator.maxTouchPoints > 1 && /Mac|iPad/.test(navigator.platform)) ||
    /iPad|Android.*Tablet/i.test(navigator.userAgent));

/** Grace period (ms) sebelum keluar fullscreen dianggap pelanggaran. */
const FULLSCREEN_GRACE_MS = 1500;

function logSuspiciousEvent(type: string, extra?: Record<string, unknown>) {
  try {
    const raw = sessionStorage.getItem('cheat_event_log');
    const log: unknown[] = raw ? JSON.parse(raw) : [];
    log.push({
      timestamp: new Date().toISOString(),
      type,
      isTablet: isTabletLikeDevice(),
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
      ...extra,
    });
    sessionStorage.setItem('cheat_event_log', JSON.stringify(log.slice(-100)));
  } catch {
    // sessionStorage mungkin tidak tersedia
  }
}

export const KICKED_OUT_KEY = 'cheat_kicked_out_reason';

export function useCheatDetection({
  onResetAnswers,
  onSubmitAnswers,
  onViolation,
  isCheatDetectionActive = true,
  maxViolations = 3,
  enabled = true,
}: Options) {
  const [violationCount, setViolationCount] = useState(0);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const countRef = useRef(0);
  const visibilityChangedDuringGrace = useRef(false);
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveMax = isTabletLikeDevice() ? maxViolations + 1 : maxViolations;

  // Effect event: selalu memakai callback & batas terbaru tanpa memasang ulang listener.
  const handleCheating = useEffectEvent((kind: 'visibility' | 'fullscreen') => {
    countRef.current += 1;
    const count = countRef.current;
    setViolationCount(count);
    onViolation?.(kind, count);

    if (count >= effectiveMax) {
      setReason('Anda telah melakukan pelanggaran maksimal. Tryout Anda otomatis dikumpulkan.');
      try {
        sessionStorage.setItem(
          KICKED_OUT_KEY,
          'Pengerjaan dihentikan dan otomatis dikumpulkan karena terdeteksi keluar dari layar penuh atau berpindah aplikasi/tab (indikasi kecurangan) melebihi batas.'
        );
      } catch {
        // abaikan
      }
      setOpen(true);
      onSubmitAnswers();
    } else if (count === 2) {
      setReason('Anda terdeteksi melakukan kecurangan lagi. Semua jawaban Anda telah dikosongkan.');
      setOpen(true);
      onResetAnswers();
    } else {
      setReason(
        kind === 'visibility'
          ? 'Anda terdeteksi membuka tab lain atau meminimalkan layar.'
          : 'Anda keluar dari mode layar penuh (fullscreen).'
      );
      setOpen(true);
    }
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const onVisibility = () => {
      if (document.hidden && isCheatDetectionActive) {
        visibilityChangedDuringGrace.current = true;
        logSuspiciousEvent('visibility_hidden');
        handleCheating('visibility');
      }
    };

    const onFullscreen = () => {
      if (document.fullscreenElement) return;
      visibilityChangedDuringGrace.current = false;

      if (!isCheatDetectionActive) {
        setReason(
          'Anda keluar dari mode layar penuh. Mohon kembali ke layar penuh untuk melanjutkan.'
        );
        setOpen(true);
        return;
      }

      logSuspiciousEvent('fullscreen_exit', { gracePending: true });
      if (graceTimer.current) clearTimeout(graceTimer.current);
      graceTimer.current = setTimeout(() => {
        graceTimer.current = null;
        if (document.fullscreenElement) {
          logSuspiciousEvent('fullscreen_recovered', { verdict: 'false_positive' });
          return;
        }
        const calm =
          document.visibilityState === 'visible' &&
          document.hasFocus() &&
          !visibilityChangedDuringGrace.current;
        if (calm && isTabletLikeDevice()) {
          // Gesture tak sengaja di tablet: masuk lagi diam-diam tanpa strike.
          logSuspiciousEvent('fullscreen_exit_tablet_gesture', { verdict: 'skipped' });
          document.documentElement.requestFullscreen?.().catch(() => {
            setReason('Mode layar penuh terputus. Ketuk "Lanjutkan Mengerjakan" untuk kembali.');
            setOpen(true);
          });
          return;
        }
        // Bila visibility sudah dihitung pada jendela ini, jangan dobel strike.
        if (visibilityChangedDuringGrace.current) return;
        logSuspiciousEvent('fullscreen_exit_strike');
        handleCheating('fullscreen');
      }, FULLSCREEN_GRACE_MS);
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      if (graceTimer.current) clearTimeout(graceTimer.current);
    };
  }, [enabled, isCheatDetectionActive]);

  return { open, setOpen, reason, violationCount, maxViolations: effectiveMax };
}
