/**
 * Motor de sonido basado en Web Audio API
 * Genera un timbre de bienvenida / notificación estética cristalina
 * sin depender de archivos de audio externos (100% offline y resiliente).
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Campanilla cristalina de notificación de nueva cita (Armonía suave D5 -> A5 -> D6)
   */
  playChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, start: 0.0, dur: 0.8 }, // D5
        { freq: 880.00, start: 0.15, dur: 0.9 }, // A5
        { freq: 1174.66, start: 0.30, dur: 1.2 }, // D6
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Envolvente de volumen suave (Ataque rápido, decaimiento elegante)
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Audio context might be restricted before first user interaction
    }
  }

  /**
   * Sonido de confirmación positiva (éxito al reservar o aceptar cita)
   */
  playSuccess() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0.0, dur: 0.3 }, // C5
        { freq: 659.25, start: 0.08, dur: 0.3 }, // E5
        { freq: 783.99, start: 0.16, dur: 0.5 }, // G5
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Silently handle
    }
  }

  /**
   * Sonido sutil de rechazo o cancelación
   */
  playReject() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Silently handle
    }
  }

  /**
   * Sonido distintivo para estado PENDIENTE (Doble tono cálido marimba/campana)
   */
  playPending() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 440.00, start: 0.0, dur: 0.25 }, // A4
        { freq: 554.37, start: 0.12, dur: 0.35 }, // C#5
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.14, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Silently handle
    }
  }

  /**
   * Sonido distintivo para estado COMPLETADA (Acorde brillante arpegiado / Triunfo)
   */
  playCompleted() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0.00, dur: 0.35 }, // C5
        { freq: 659.25, start: 0.07, dur: 0.35 }, // E5
        { freq: 783.99, start: 0.14, dur: 0.40 }, // G5
        { freq: 1046.50, start: 0.21, dur: 0.65 }, // C6
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.16, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch {
      // Silently handle
    }
  }
}

export const soundService = new SoundEngine();
