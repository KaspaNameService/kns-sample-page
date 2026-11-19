/**
 * What a write example asks of the page around it. `main.ts` implements it with a confirm box under the section;
 * your app would use its own dialog.
 */
export interface WriteUi {
  /**
   * Show what the wallet is about to be asked to sign, and resolve `true` only when the user confirms.
   * `summary` is the plan's own one-line description; `details` are extra lines (amounts, warnings).
   */
  confirm(summary: string, ...details: string[]): Promise<boolean>
  /** Show where a running write is: checking, signing, broadcasting, waiting for the tracker. */
  progress(text: string): void
}
