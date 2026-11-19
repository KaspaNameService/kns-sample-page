/**
 * 1. Send to a name
 *
 * Teaches: `kns.recipientFor(input)`, the one call behind a "send to" field. It takes whatever the user typed,
 * a name (`alice.kas`), a subdomain (`pay.alice.kas`) or a plain address, and answers the address to pay, or why
 * there is none. It never throws on the input itself.
 *
 * Rules worth copying into your wallet:
 * - Pay `address` and nothing else. When a name does not resolve, stop. Never fall back to a cached address,
 *   a similar name or the raw input.
 * - Show `name`, the standard spelling (`Alice.KAS` becomes `alice.kas`), not what the user typed.
 * - Resolve again right before the payment is signed: names change hands.
 */
import type { OwnerType, RecipientFault } from '@knsdomains/sdk'
import { kns } from '../kns'

/** Why a name has no address to pay, in words a user understands. */
const FAULTS: Record<RecipientFault, string> = {
  unresolved: 'No record for this name: it is not registered, or the tracker has not caught up yet.',
  'in-covenant': 'A contract holds this name, and a contract has no address to pay.',
  withheld: 'The recorded spelling breaks the naming rules, so the name is never resolved.',
  moved: 'The name moved to a newer contract version.',
  'not-ready': 'The tracker is not ready to answer safely. Try again in a moment.',
}

/** What to warn about before sending, given who holds the name. */
function warningsFor(ownerType: OwnerType | null, listed: boolean): string[] {
  const out: string[] = []
  if (ownerType === 'p2sh') out.push('This address is a multisig or a script. Make sure that is what you expect.')
  if (listed) out.push('This name is listed for sale: the seller holds it now, but it may change hands.')
  return out
}

export async function sendToName(input: string) {
  const r = await kns.recipientFor(input)

  switch (r.kind) {
    // Not a .kas name and not a Kaspa address on this network.
    case 'neither':
      return { show: 'Not a .kas name or a testnet-10 address.', reason: r.reason }

    // A plain address pays itself. `ownerType` still says what kind it is.
    case 'address':
      return {
        show: `Pay ${r.address}`,
        address: r.address,
        ownerType: r.ownerType,
        warnings: warningsFor(r.ownerType, false),
      }

    // A name or a subdomain pays its on-chain holder, or carries a `fault` and no address.
    case 'domain':
    case 'subdomain':
      if (r.address === null) {
        const fault = r.fault ?? 'unresolved'
        return { show: `${r.name} cannot be paid.`, name: r.name, fault, why: FAULTS[fault] }
      }
      return {
        show: `Pay ${r.name}: ${r.address}`,
        name: r.name, // the standard spelling: show this
        address: r.address, // pay this, and nothing else
        ownerType: r.ownerType, // 'schnorr' | 'ecdsa' | 'p2sh' | 'covenant'
        listed: r.listed,
        // true or false once you give the reader a node (see the SDK docs), null without one: the tracker's word.
        proven: r.proven,
        warnings: warningsFor(r.ownerType, r.listed),
      }
  }
}
