/**
 * 5. Connect a wallet
 *
 * Teaches: `kaswareSigner` and `kastleSigner` from `@knsdomains/sdk-tx`. Each opens its wallet's connect prompt,
 * checks the wallet is on testnet-10, reads the account's public key and answers a `KnsSigner`. The adapters carry
 * each wallet's quirks for you, and re-read the account and the network right before every signing prompt, so a
 * wallet that switched accounts or networks is caught before it signs.
 *
 * Why only these two: to manage a name, a wallet must also sign the name's own covenant input, which is not at the
 * account's address. KasWare (0.9+) and Kastle (2.59.1+) do; a wallet that will not cannot manage names. Writing a
 * signer for your own wallet: see the signing spec,
 * https://github.com/KaspaNameService/kns-sdk-docs/blob/main/wallet-signing.md
 *
 * `tx.probeSigner()` checks a wallet build for exactly that, broadcasting nothing. It asks the wallet to sign,
 * so it opens a prompt: run it once per wallet build, not on every connect.
 */
import { hasKasware, hasKastle, kaswareSigner, kastleSigner } from '@knsdomains/sdk-tx'
import { NETWORK, createWriter } from '../kns'

export type WalletId = 'kasware' | 'kastle'

/** Which wallets are installed. Call it after the page loads: extensions inject on their own schedule. */
export function detectWallets(): Record<WalletId, boolean> {
  return { kasware: hasKasware(), kastle: hasKastle() }
}

export async function connectWallet(id: WalletId) {
  // `prompt: true` opens the wallet's connect dialog. With `prompt: false` the adapter only uses an account this
  // site is already authorised for: what a page uses to reconnect silently after a reload.
  const signer =
    id === 'kasware'
      ? await kaswareSigner({ network: NETWORK, prompt: true })
      : await kastleSigner({ network: NETWORK, prompt: true })

  // The writer: loads the contract module and picks a node (see src/kns.ts).
  const tx = await createWriter(signer)
  const status = await tx.status() // cached by the module after the first call

  return {
    show: `Connected ${signer.name}: ${signer.address}`,
    wallet: signer.name,
    address: signer.address,
    scheme: signer.ownerScheme, // 'schnorr' or 'ecdsa': both work
    node: tx.nodeUrl,
    wasm: status.api_version, // the contract module is loaded
  }
}
