/**
 * 6. Register a name
 *
 * Teaches: quote, confirm, then `tx.registerName(name)`.
 *
 * A registration is ONE transaction and ONE wallet prompt. There is no plan object for it: the quote is what the
 * user confirms, and `registerName` checks everything again (open registration, the name still free, the module's
 * own spelling, the wallet's balance) before it asks the wallet to sign.
 *
 * The first registration accepted wins: the protocol accepts front-running. Refusals before signing come back as
 * `KnsTxError` codes `taken`, `registration-closed` or `insufficient-funds` (see "Errors" at the bottom).
 */
import { formatKas } from '@knsdomains/sdk'
import { kns, writer } from '../kns'
import type { WriteUi } from './write-ui'

export async function registerName(input: string, ui: WriteUi) {
  const tx = writer() // throws "Connect a wallet first" before section 5

  // 1. Quote: local. `q.name` is the standard spelling: register and show that, not the raw input.
  const q = kns.quote(input)

  // 2. Free? Asked by hash prefix, so the tracker never learns the name.
  if (!(await kns.available(q.name))) return { show: `${q.name} is taken. Nothing was signed.` }

  // 3. Confirm, with the whole cost, before the wallet prompt.
  const confirmed = await ui.confirm(
    `register ${q.name}`,
    `Registration fee: ${formatKas(q.feeSompi)} KAS`,
    `Locked with the name: ${formatKas(q.lockedSompi)} KAS (deposits that stay with the name)`,
    `Your wallet needs: ${formatKas(q.totalToFund)} KAS, ` +
      `including a ${formatKas(q.allowanceSompi)} KAS network-fee allowance`
  )
  if (!confirmed) return null // the user cancelled: nothing was signed

  // 4. Submit. `onProgress` reports checking → signing (the wallet prompt) → broadcasting → done.
  const done = await tx.registerName(q.name, { onProgress: (p) => ui.progress(p.phase) })

  // The tracker indexes the chain a few seconds behind it. Wait, so the next read sees the new name.
  ui.progress(`sent ${done.txid}, waiting for the tracker`)
  await tx.waitForIndex(q.name, done.txid)

  return {
    show: `Registered ${q.name}.`,
    txid: done.txid,
    feePaid: `${formatKas(done.feeSompi)} KAS`,
    warnings: done.warnings, // empty for a normal account; show them when not
  }
}
