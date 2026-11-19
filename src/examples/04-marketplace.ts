/**
 * 4. Marketplace: browse listings
 *
 * Teaches: `kns.listings({ sort, partner })`, the names for sale, from the tracker.
 * - `sort`: 'price_asc' | 'price_desc' | 'listed_newest' | 'listed_oldest'.
 * - `partner`: leave it out for every listing, pass a marketplace's address for the listings whose partner fee
 *   goes to it, or 'none' for the listings without a partner fee.
 *
 * A partner fee is a marketplace's share of a sale, written into the listing when the seller signs it (section 9):
 * an address and a rate in basis points (100 = 1%, at most 1000 = 10%). It comes OUT of the price, not on top:
 * every purchase, through any front end, pays the fee to that address and the rest to the seller, or the contract
 * refuses it.
 */
import { formatBps, formatKas, type ListingSort } from '@knsdomains/sdk'
import { kns } from '../kns'

/** `partner`: '' for every listing, 'none' for the ones without a fee, or the partner's address. */
export async function browseListings(sort: ListingSort, partner: string) {
  // A partner address is checked before anything is asked: one from another network is an InvalidAddressError.
  const page = await kns.listings({ sort, limit: 50, partner: partner.trim() || undefined })

  return {
    show: `${page.matched} listing(s) for sale.`,
    listings: page.domains.map((record) => {
      const price = record.listed_price_sompi ?? 0n
      return {
        name: kns.display(record).text, // `record.fqdn` can be missing: display() falls back to a short hash
        price: `${formatKas(price)} KAS`, // what the buyer pays
        partnerFee: record.listed_fee_bps
          ? {
              rate: formatBps(record.listed_fee_bps), // 250 → '2.5%'
              amount: `${formatKas(record.listed_fee_sompi ?? 0n)} KAS`, // out of the price
              to: record.listed_fee_to_address,
            }
          : null, // no partner fee: the seller gets the whole price
        seller: record.owner_address,
        listedAt: record.listed_at === undefined ? null : new Date(Number(record.listed_at)).toISOString(),
      }
    }),
    nextCursor: page.next_cursor ?? null, // pass back as `cursor` for the next page
  }
}
