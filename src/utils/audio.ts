/**
 * Silent SoundEngine: All audio effects disabled as requested.
 */
class SoundEngine {
  private isMuted: boolean = true;

  public setMuted(_muted: boolean) {
    this.isMuted = true;
  }

  public getMuted(): boolean {
    return true;
  }

  /**
   * Completely silent - no audio playback
   */
  public playTaskRewardSound() {
    return;
  }

  public playClickSound() {
    return;
  }

  public playClick() {
    return;
  }

  public playSuccess() {
    return;
  }

  public playError() {
    return;
  }

  public playWarning() {
    return;
  }

  public playUpgradeSound() {
    return;
  }
}

export const soundEngine = new SoundEngine();

