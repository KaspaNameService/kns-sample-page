/**
 * What every write example shares (sections 6 to 10).
 *
 * - `WriteUi`: what a write example asks of the page around it. `main.ts` implements it with a confirm box under
 *   the section; your app supplies its own dialog.
 * - `waitForTracker`: the step after a transaction was sent. A time-out here is NOT a failure.
 */
import type { KnsTx } from '@knsdomains/sdk-tx'

export interface WriteUi {
  /**
   * Show what the wallet is about to be asked to sign, and resolve `true` only when the user confirms.
   * `summary` is the plan's own one-line description; `details` are extra lines (amounts, warnings).
   */
  confirm(summary: string, ...details: string[]): Promise<boolean>
  /** Show where a running write is: checking, signing, broadcasting, waiting for the tracker. */
  progress(text: string): void
}

/** What to tell the user when the tracker has not shown a sent transaction yet. */
export const NOT_SHOWN_YET = 'The tracker has not shown it yet: look again in a minute. Do not send it again.'

/**
 * Wait until the tracker shows what transaction `txid` did to `name`, so the next read, or the next plan for this
 * name, sees the new state. The chain is ahead of the tracker by a few seconds.
 *
 * Call it only AFTER the transaction was sent, and keep its errors away from the error box: answer `true` when the
 * tracker shows the transaction, and `false` when it has not yet. Either way the transaction is sent, so the
 * result still carries the txid, and the user is told it is on its way, never that it failed.
 *
 * The usual `false` is `waitForIndex` giving up after two minutes: a `KnsTxError` with code `unknown` and
 * `afterSigning` false. Passed to a generic error handler, that would read "refused" for a transaction that went
 * through. A tracker that stops answering while we wait (`TimeoutError`, `ApiError`) does not undo the send either.
 */
export async function waitForTracker(tx: KnsTx, name: string, txid: string, ui: WriteUi): Promise<boolean> {
  ui.progress(`sent ${txid}, waiting for the tracker`)
  try {
    await tx.waitForIndex(name, txid) // polls every 1.5 s, gives up after 120 s ({ timeoutMs } changes that)
    return true
  } catch (e) {
    console.warn('The transaction was sent; the tracker has not shown it yet.', e)
    return false
  }
}
