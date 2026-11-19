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
import { NOT_SHOWN_YET, waitForTracker, type WriteUi } from './write-ui'

export async function changePrimaryName(name: string, action: 'set' | 'clear', ui: WriteUi) {
  const tx = writer()

  const plan = action === 'set' ? await tx.planSetPrimary(name) : await tx.planClearPrimary(name)
  if (!(await ui.confirm(plan.summary))) return null // e.g. 'make alice.kas the primary name of kaspatest:…'

  const result = await tx.submit(plan)
  // Let the tracker catch up before the next spend of this name: a plan built on the old state is refused.
  const indexed = await waitForTracker(tx, plan.name, result.txid, ui)

  const done = `${plan.name} is ${action === 'set' ? 'now' : 'no longer'} the primary name.`
  return { show: indexed ? done : `Sent: ${plan.summary}. ${NOT_SHOWN_YET}`, txid: result.txid }
}
