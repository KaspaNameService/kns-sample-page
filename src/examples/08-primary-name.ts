/**
 * 8. Set or clear the primary name
 *
 * Teaches: `tx.planSetPrimary(name)` and `tx.planClearPrimary(name)`. The primary name is the one name an address
 * chooses to show: what `kns.primaryNameFor(address)` answers in section 2. Same plan, confirm, submit pattern as
 * section 7; the wallet pays only the network fee.
 *
 * Setting a new primary name is enough: the newest flagged name wins. A transfer or a sale clears the flag.
 */
import { writer } from '../kns'
import type { WriteUi } from './write-ui'

export async function changePrimaryName(name: string, action: 'set' | 'clear', ui: WriteUi) {
  const tx = writer()

  const plan = action === 'set' ? await tx.planSetPrimary(name) : await tx.planClearPrimary(name)
  if (!(await ui.confirm(plan.summary))) return null // e.g. 'make alice.kas the primary name of kaspatest:…'

  const result = await tx.submit(plan)
  ui.progress(`sent ${result.txid}, waiting for the tracker`)
  // Let the tracker catch up before the next spend of this name: a plan built on the old state is refused.
  await tx.waitForIndex(plan.name, result.txid)

  return {
    show: action === 'set' ? `${plan.name} is now the primary name.` : `${plan.name} is no longer the primary name.`,
    txid: result.txid,
  }
}
