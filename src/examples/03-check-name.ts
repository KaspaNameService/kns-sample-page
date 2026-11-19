/**
 * 3. Check a name
 *
 * Teaches the two questions a search box asks before registration:
 * - `kns.quote(name)`: what registering costs. Local, no request. It also normalizes the name: `q.name` is the
 *   standard spelling (`Alice.KAS` becomes `alice.kas`), and a name that cannot exist throws `InvalidNameError`.
 * - `kns.available(name)`: whether it is free now. It asks the tracker by hash prefix and picks the answer
 *   itself, so the tracker never learns which name you are about to register.
 *
 * Prices go by length in code points: 1 or 2 characters 4,200 KAS, 3 → 2,100, 4 → 525, 5 or more → 35 KAS.
 * Show what `quote` answers rather than hard-coding this list: `台北.kas` is 2 code points, and so is a flag emoji.
 *
 * A subdomain (`pay.alice.kas`, `tier` null) is not for anyone to register: only the holder of its parent mints it,
 * paying a flat 1 KAS subdomain fee plus the deposits. Say so, so a free subdomain does not read as "yours for 1 KAS".
 */
import { formatKas } from '@knsdomains/sdk'
import { kns } from '../kns'

export async function checkName(input: string) {
  const q = kns.quote(input) // amounts are bigint sompi (1 KAS = 100,000,000 sompi); formatKas converts
  const free = await kns.available(q.name)

  // Only for a taken name, and only to say whether it is for sale: `lookup` tells the tracker the name.
  let status = free ? 'available' : 'taken'
  if (!free) {
    const l = await kns.lookup(q.name)
    if (l.kind === 'listed') status = `taken, listed for sale at ${formatKas(l.priceSompi)} KAS (see section 10)`
  }

  // `tier` is null for a subdomain: its fee is the parent holder's to pay when they mint it, not a registration.
  let show = `${q.name} is ${status}. Registration fee ${formatKas(q.feeSompi)} KAS.`
  if (q.tier === null) {
    const parent = q.name.slice(q.name.indexOf('.') + 1)
    const cost = `${formatKas(q.feeSompi)} KAS subdomain fee plus ${formatKas(q.lockedSompi)} KAS of deposits`
    show = free
      ? `${q.name} is free, but only the holder of ${parent} can mint it (${cost}).`
      : `${q.name} is ${status}.`
  }

  return {
    show,
    name: q.name,
    available: free,
    codePoints: q.codePoints,
    tier: q.tier, // 1 to 5, or null for a subdomain (flat 1 KAS fee, minted by the parent's holder)
    fee: `${formatKas(q.feeSompi)} KAS`, // paid to the registry (for a subdomain, by the parent's holder)
    lockedWithName: `${formatKas(q.lockedSompi)} KAS`, // three deposits that stay with the name
    networkFeeAllowance: `${formatKas(q.allowanceSompi)} KAS`, // set aside; about 0.02 KAS is used
    walletNeeds: `${formatKas(q.totalToFund)} KAS`, // test "can afford" against this, and fund a little more
  }
}
