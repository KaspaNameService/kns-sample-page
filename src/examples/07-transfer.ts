/**
 * 7. Transfer a name
 *
 * Teaches the pattern EVERY spend of a name uses (sections 7 to 10): plan, confirm, submit.
 * - `tx.planTransfer(name, to)` reads the name's current state, has the contract module confirm it on the node,
 *   and checks the rules (the wallet must hold the name, a listed name must be cancelled first). Nothing is signed.
 * - Show `plan.summary` and let the user confirm.
 * - `tx.submit(plan)` builds the transaction, has the wallet sign it, checks the signature and sends it.
 *
 * Build the plan right before the confirm step: a plan older than the name's state is refused. The wallet pays only
 * the network fee, about 0.015 KAS.
 */
import { writer } from '../kns'
import type { WriteUi } from './write-ui'

export async function transferName(name: string, to: string, ui: WriteUi) {
  const tx = writer()

  // The recipient is an address. Bare hex is refused: a key and a multisig's script hash look the same.
  // The name's profile is kept by default: pass { profile: 'clear' } or a new CID to change it.
  const plan = await tx.planTransfer(name, to.trim())

  const details: string[] = []
  if (plan.recipient?.warn) {
    details.push('Warning: the recipient is a multisig or a contract. Make sure it can manage a name.')
  }
  if (!(await ui.confirm(plan.summary, ...details))) return null // e.g. 'send alice.kas to kaspatest:qr…'

  const result = await tx.submit(plan)
  ui.progress(`sent ${result.txid}, waiting for the tracker`)
  await tx.waitForIndex(plan.name, result.txid)

  return {
    show: `${plan.name} now belongs to ${to.trim()}.`,
    txid: result.txid,
    warnings: result.warnings, // for a multisig or contract recipient: what holding the name means. Show them.
  }
}
