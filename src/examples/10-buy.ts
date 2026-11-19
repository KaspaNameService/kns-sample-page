/**
 * 10. Buy a listed name
 *
 * Teaches: `tx.planBuy(name, { expectedPriceSompi })`, with the expected-price check.
 *
 * `expectedPriceSompi` is the price the buyer SAW. If the listing's price is different when the plan is built (the
 * seller cancelled and listed again higher, say), `planBuy` refuses, with nothing signed. Pass the price your
 * listing screen showed; this example reads it with `kns.resolveName`, or takes the one you type, so you can see
 * the check refuse a wrong price.
 *
 * The buyer pays the price (`plan.spendsSompi`) plus the network fee. A partner fee comes OUT of the price:
 * `plan.sale` says what the seller and the partner each get. A purchase clears the name's profile and primary flag.
 */
import { formatBps, formatKas, parseKas } from '@knsdomains/sdk'
import { kns, writer } from '../kns'
import { NOT_SHOWN_YET, waitForTracker, type WriteUi } from './write-ui'

/** `sawPriceKas` empty: use the listing's current price, as a listing screen would have shown it. */
export async function buyName(name: string, sawPriceKas: string, ui: WriteUi) {
  const tx = writer()

  // The listing as the tracker has it. `r.name` can be null (no spelling for the hash): keep the input then.
  const r = await kns.resolveName(name)
  if (r === null || r.listedPriceSompi === null) return { show: `${name.trim()} is not for sale.` }
  const expectedPriceSompi = sawPriceKas.trim() ? parseKas(sawPriceKas.trim()) : r.listedPriceSompi

  const plan = await tx.planBuy(r.name ?? name, { expectedPriceSompi }) // refuses a price that is not this one

  const details: string[] = []
  if (plan.sale) {
    details.push(`The seller gets: ${formatKas(plan.sale.sellerSompi)} KAS`)
    if (plan.sale.partnerFee) {
      const { bps, address } = plan.sale.partnerFee
      details.push(`Partner fee: ${formatKas(plan.sale.partnerSompi)} KAS (${formatBps(bps)}) to ${address}`)
    }
  }
  details.push(`You pay: ${formatKas(plan.spendsSompi)} KAS and the network fee`)
  if (!(await ui.confirm(plan.summary, ...details))) return null

  const result = await tx.submit(plan)
  // Sent: the purchase is on its way. Not shown by the tracker yet is not a failure (see write-ui.ts).
  const indexed = await waitForTracker(tx, plan.name, result.txid, ui)

  return {
    show: indexed ? `You bought ${plan.name}.` : `Sent your purchase of ${plan.name}. ${NOT_SHOWN_YET}`,
    txid: result.txid,
    paid: `${formatKas(plan.spendsSompi)} KAS`,
  }
}
