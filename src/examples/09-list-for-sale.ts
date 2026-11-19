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
 */
import { formatBps, formatKas, parseKas } from '@knsdomains/sdk'
import { partnerFeeWaivedText, type PartnerFeeRequest, type Plan } from '@knsdomains/sdk-tx'
import { writer } from '../kns'
import type { WriteUi } from './write-ui'

/** The lines a seller should read before signing: the split, and the waiver when there is one. */
function saleLines(plan: Plan<'list' | 'cancel'>): string[] {
  const lines: string[] = []
  const sale = plan.sale
  if (sale) {
    lines.push(`Price: ${formatKas(sale.priceSompi)} KAS`)
    lines.push(`The seller gets: ${formatKas(sale.sellerSompi)} KAS`)
    if (sale.partnerFee) {
      const { bps, address } = sale.partnerFee
      lines.push(`The partner gets: ${formatKas(sale.partnerSompi)} KAS (${formatBps(bps)}) at ${address}`)
    }
  }
  // The SDK's own sentence: "partner fee 0.025 KAS is below the 0.2 KAS minimum, so this listing has no fee".
  if (plan.partnerFeeWaived) lines.push(`Note: ${partnerFeeWaivedText(plan.partnerFeeWaived)}.`)
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

  if (!(await ui.confirm(plan.summary, ...saleLines(plan)))) return null

  const result = await tx.submit(plan)
  ui.progress(`sent ${result.txid}, waiting for the tracker`)
  await tx.waitForIndex(plan.name, result.txid)

  return {
    show: `${plan.name} is listed at ${formatKas(plan.sale?.priceSompi ?? 0n)} KAS.`,
    txid: result.txid,
    partnerFeeWaived: plan.partnerFeeWaived !== undefined,
  }
}

export async function cancelListing(name: string, ui: WriteUi) {
  const tx = writer()

  // The listing's fee is part of the address it sits at, so the plan carries it. A cancel pays nobody.
  const plan = await tx.planCancel(name)
  if (!(await ui.confirm(plan.summary, ...saleLines(plan)))) return null

  const result = await tx.submit(plan)
  ui.progress(`sent ${result.txid}, waiting for the tracker`)
  await tx.waitForIndex(plan.name, result.txid)

  return { show: `${plan.name} is no longer for sale.`, txid: result.txid }
}
