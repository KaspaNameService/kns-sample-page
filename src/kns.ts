/**
 * The one place this page makes its KNS clients. Every example imports from here.
 *
 * - `kns` is the READER, from `@knsdomains/sdk`. It resolves names, lists the names an address holds, quotes
 *   prices and browses listings. It needs no wallet, no node and no wasm, so it works as soon as the page loads.
 *
 * - `createWriter(signer)` makes the WRITER, from `@knsdomains/sdk-tx`. It registers names and spends the ones
 *   the connected wallet holds. It needs three things the reader does not: the KNS contract module
 *   (`@knsdomains/wasm`, 8.9 MB), a Kaspa node to build transactions against, and a wallet to sign them.
 *   That is why the page makes it only when a wallet connects (section 5), not at start-up.
 */
import { Kns } from '@knsdomains/sdk'
import { KnsTx, type KnsSigner } from '@knsdomains/sdk-tx'
// `@knsdomains/wasm` is installed by `@knsdomains/sdk-tx`, at the exact version it was tested with.
// Import it, but do not add it to package.json yourself.
import { load } from '@knsdomains/wasm'

/**
 * KNS runs on Kaspa testnet-10 for now. The SDK version (`0.1.0-tn10.4d10952e`) names the deployment, the
 * "lineage", it was built for. A new lineage means a new SDK version: update both packages together.
 */
export const NETWORK = 'testnet-10'

/**
 * The reader. The public KNS tracker for testnet-10 (https://gap-tn10.knsdomains.org) is built in. Before its
 * first answer is used, the reader checks that the tracker serves the same registry this SDK build carries, and
 * refuses one that does not (`RegistryMismatchError`).
 */
export const kns = new Kns({ network: NETWORK })

/** The writer for the connected wallet, or null before section 5. */
let current: KnsTx | null = null

/**
 * Make the writer for a wallet's signer (section 5 gets the signer from KasWare or Kastle).
 * One `KnsTx` per account: connecting another wallet makes a new one.
 */
export async function createWriter(signer: KnsSigner): Promise<KnsTx> {
  // The module and the node are independent, so fetch both at once.
  const [wasm, nodeUrl] = await Promise.all([load(), testnetNode()])
  const tx = new KnsTx({ kns, wasm, nodeUrl, signer })
  // Ask the module which deployment it is running. It throws here, before anything is built, if the module
  // and this SDK build disagree about the registry.
  await tx.status()
  current = tx
  return tx
}

/** The writer, for the write examples (sections 6 to 10). Throws a readable error before a wallet connects. */
export function writer(): KnsTx {
  if (!current) throw new Error('Connect a wallet first (section 5).')
  return current
}

/**
 * A testnet-10 Kaspa node, as a Borsh wRPC URL (`wss://…/wrpc/borsh`): what `KnsTx` builds transactions against.
 *
 * Set `VITE_KASPA_NODE_URL` in a `.env.local` file to use your own node (it needs `--utxoindex`). Otherwise the
 * page asks the Kaspa public node network's resolvers for the least-loaded public node. Public nodes are shared:
 * when a write fails with `node-unreachable`, reload to get another one, or run your own.
 */
async function testnetNode(): Promise<string> {
  const own: unknown = import.meta.env.VITE_KASPA_NODE_URL
  if (typeof own === 'string' && own !== '') return own

  for (const resolver of ['eric.kaspa.stream', 'maxim.kaspa.stream', 'john.kaspa.red', 'mike.kaspa.red']) {
    try {
      const res = await fetch(`https://${resolver}/v2/kaspa/${NETWORK}/tls/wrpc/borsh`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const { url } = (await res.json()) as { url?: unknown }
      // Only accept what we asked for: a TLS WebSocket (an https page cannot open ws://) to a Borsh endpoint.
      if (typeof url === 'string' && url.startsWith('wss://') && url.endsWith('/wrpc/borsh')) return url
    } catch {
      // This resolver is down or busy: try the next one.
    }
  }
  throw new Error(`No public ${NETWORK} node answered. Set VITE_KASPA_NODE_URL to your own node.`)
}
