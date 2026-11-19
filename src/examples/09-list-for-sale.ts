/**
 * 9. List a name for sale, with an optional partner fee, and cancel
 *
 * Teaches: `tx.planList(name, priceSompi, { partnerFee })` and `tx.planCancel(name)`.
 *
 * - The price is at least 0.2 KAS.
 * - A partner fee is YOUR marketplace's share of the sale: an address and 1 to 1000 basis points (10% at most) of
 *   the price. The seller agrees to it by signing the listing, and every purchase, through any front end, pays it.
 *   Leave `partnerFee` out for none.
 * - A fee that comes to less than 0.2 KAS is WAIVED, not refused: the listing carries no fee, and the plan says so
 *   in `plan.partnerFeeWaived`. Tell the seller before they sign. At 10% the lowest price that keeps a fee is 2 KAS;
 *   at 1%, 20 KAS.
 * - `plan.sale` is the split: the price, what the seller gets, what the partner gets.
 * - While listed, a name cannot be transferred or changed, and its fee cannot change: cancel first.
 * - A cancel pays nobody. Its plan still carries the old listing's terms in `plan.sale`: do not show them as a split.
 */
import { formatBps, formatKas, parseKas } from '@knsdomains/sdk'
import type { PartnerFeeRequest, Plan } from '@knsdomains/sdk-tx'
import { writer } from '../kns'
import { NOT_SHOWN_YET, waitForTracker, type WriteUi } from './write-ui'

/**
 * A breakdown of a listing's summary, line by line, for the seller to read before signing. The summary already
 * says all of it in one sentence, the waiver included ("…; partner fee 0.125 KAS is below the 0.2 KAS minimum, so
 * this listing has no fee"), so the waiver is not repeated here. A screen that does not show the summary can get
 * that sentence alone from `partnerFeeWaivedText(plan.partnerFeeWaived)`.
 */
function listingBreakdown(plan: Plan<'list'>): string[] {
  const sale = plan.sale
  if (!sale) return []
  const lines = [`Price: ${formatKas(sale.priceSompi)} KAS`, `The seller gets: ${formatKas(sale.sellerSompi)} KAS`]
  if (sale.partnerFee) {
    const { bps, address } = sale.partnerFee
    lines.push(`The partner gets: ${formatKas(sale.partnerSompi)} KAS (${formatBps(bps)}) at ${address}`)
  } else if (plan.partnerFeeWaived) {
    // The check that matters: a fee was asked for and this listing will not carry it.
    lines.push('The partner gets: nothing. The fee asked for is waived, as the summary says.')
  }
  return lines
}

/** `partnerAddress` empty means no partner fee. */
export async function listForSale(
  name: string,
  priceKas: string,
  partnerAddress: string,
  partnerBps: string,
  ui: WriteUi
) {
  const tx = writer()

  const partnerFee: PartnerFeeRequest | undefined = partnerAddress.trim()
    ? { address: partnerAddress.trim(), bps: Number(partnerBps) } // 250 = 2.5%
    : undefined

  // parseKas('25') → 2_500_000_000n sompi. The plan checks the price, the rate and the address; nothing is signed.
  const plan = await tx.planList(name, parseKas(priceKas.trim()), { partnerFee })

  if (!(await ui.confirm(plan.summary, ...listingBreakdown(plan)))) return null

  const result = await tx.submit(plan)
  const indexed = await waitForTracker(tx, plan.name, result.txid, ui) // not shown yet is not a failure

  const listed = `${plan.name} at ${formatKas(plan.sale?.priceSompi ?? 0n)} KAS`
  return {
    show: indexed ? `Listed ${listed}.` : `Sent the listing of ${listed}. ${NOT_SHOWN_YET}`,
    txid: result.txid,
    partnerFeeWaived: plan.partnerFeeWaived !== undefined,
  }
}

export async function cancelListing(name: string, ui: WriteUi) {
  const tx = writer()

  // The listing's fee is part of the address it sits at, so the plan carries the old terms in `plan.sale`. But a
  // cancel pays nobody: show the summary and the current price, never the seller's or the partner's share.
  const plan = await tx.planCancel(name)
  const listedAt = plan.sale ? `Listed now at ${formatKas(plan.sale.priceSompi)} KAS. ` : ''
  const note = `${listedAt}A cancel pays nobody: the wallet pays only the network fee.`
  if (!(await ui.confirm(plan.summary, note))) return null

  const result = await tx.submit(plan)
  const indexed = await waitForTracker(tx, plan.name, result.txid, ui)

  return {
    show: indexed ? `${plan.name} is no longer for sale.` : `Sent the cancel for ${plan.name}. ${NOT_SHOWN_YET}`,
    txid: result.txid,
  }
}
