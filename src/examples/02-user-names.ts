/**
 * 2. A user's names
 *
 * Teaches two reads about an address, after a local check that the input is one:
 * - `kns.classify(input)`: an address, a name, a subdomain or neither, with no request. Check first, so a typo
 *   costs no round trip and the user gets the reason (`kaspa:…` is not a testnet-10 address).
 * - `kns.primaryNameFor(address)`: the ONE name its holder chose to show, by setting the on-chain primary flag
 *   (section 8 sets it). Use it wherever you would show the address: a header, a contact list, a history row.
 * - `kns.namesOf(address, { limit })`: every name the address holds, one page at a time.
 *
 * Rules worth copying:
 * - No primary name means no name: show the address. Never pick another name the address holds instead.
 * - Show each record through `kns.display(record)`. It shows a name only when the name hashes to the record,
 *   and a short hash otherwise, so a tracker cannot make you display a name it made up.
 * - Cache these answers for minutes at most: a transfer or a sale changes them.
 */
import { formatKas } from '@knsdomains/sdk'
import { kns } from '../kns'

export async function namesOfAddress(input: string) {
  // Local: an input that is not an address on this network sends no request at all.
  const c = kns.classify(input)
  if (c.kind !== 'address') {
    const why = c.kind === 'neither' ? c.reason : `${c.name} is a name: section 1 turns a name into its address.`
    return { show: 'Not a testnet-10 address.', why }
  }
  const owner = c.address

  // Two independent reads: ask both at once.
  const [primary, page] = await Promise.all([
    kns.primaryNameFor(owner),
    kns.namesOf(owner, { limit: 50 }), // the next page: { limit: 50, cursor: page.next_cursor }
  ])

  return {
    show: primary.name
      ? `Shown as ${primary.name}, holds ${page.matched} name(s).`
      : `No primary name: show the address. Holds ${page.matched} name(s).`,
    primaryName: primary.name, // null when the holder chose none
    held: page.matched,
    names: page.domains.map((record) => {
      const shown = kns.display(record)
      return {
        name: shown.text, // the name, or a short hash when the record cannot be spelled
        primary: record.primary,
        listedFor: record.listed_price_sompi === undefined ? null : `${formatKas(record.listed_price_sompi)} KAS`,
        nonAscii: shown.nonAscii, // beyond a-z 0-9 -: it can look like another name, so flag it
        legacy: shown.legacy, // moved over from the old inscription registry
      }
    }),
    nextCursor: page.next_cursor ?? null, // more pages when this is not null
  }
}
