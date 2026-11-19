/**
 * Errors: one readable message for anything a section throws
 *
 * Teaches how to catch the SDK's errors. Everything both packages throw extends `KnsError`, so one `catch`
 * covers reads and writes:
 * - A write refuses with `KnsTxError`. Branch on its `code`, never on `message` (the text may change).
 * - When `afterSigning` is true, the wallet had signed and a transaction may be on its way. Never retry by
 *   yourself: look the name up first (`sentTxid` names the transaction when the refusal knows it).
 * - Most refusals happen before the wallet is asked, and their message ends "Nothing was signed".
 * - A read throws `InvalidNameError`, `InvalidAddressError`, `ApiError`, `TimeoutError`, `RegistryMismatchError`…
 *
 * Every section on this page shows its errors through `explainError`.
 */
import { InvalidAddressError, InvalidNameError, KnsError, RegistryMismatchError } from '@knsdomains/sdk'
import { KnsTxError, type TxErrorCode } from '@knsdomains/sdk-tx'

/** What each write refusal means for the user. The SDK's message follows with the details. */
const TX_CODES: Partial<Record<TxErrorCode, string>> = {
  taken: 'Somebody already holds this name. Nothing was signed.',
  'insufficient-funds': 'The wallet cannot pay for this. Get testnet KAS from https://faucet-tn10.kaspanet.io.',
  'wallet-declined': 'The wallet declined to sign. Nothing was sent.',
  'signature-invalid': 'The wallet returned a signature that does not verify. Nothing was sent.',
  'lost-race': 'Somebody else got there first. Check the name and try again.',
  'not-accepted': 'The transaction was sent but not seen accepted yet. Look it up before you try again.',
  'not-registered': 'This name is not registered.',
  'hint-refuted': 'The tracker is a moment behind the chain, often just after a change to this name. Try again soon.',
  'node-unreachable': 'The Kaspa node did not answer. Reload the page to pick another public node.',
  'registration-closed': 'Registration has not opened on this deployment yet.',
}

export function explainError(e: unknown): string {
  if (e instanceof KnsTxError) {
    if (e.afterSigning) {
      // The one case where you must NOT simply try again.
      const tx = e.sentTxid ? ` Transaction: ${e.sentTxid}.` : ''
      return `The wallet signed, and this may have been sent.${tx} Check the name before trying again.\n\n${e.message}`
    }
    // `unknown` is usually a product rule (you do not hold the name, it is listed…): the message says which.
    const meaning = TX_CODES[e.code] ?? 'The operation was refused.'
    return `${meaning}\n\n[${e.code}] ${e.message}`
  }
  if (e instanceof InvalidNameError) return `That is not a valid name: ${e.message}`
  if (e instanceof InvalidAddressError) return `That is not a testnet-10 address: ${e.message}`
  if (e instanceof RegistryMismatchError) {
    // The tracker serves another lineage: the packages need an update. Turn name features off until then.
    const update = 'Update @knsdomains/sdk and @knsdomains/sdk-tx.'
    return `The KNS tracker serves a different registry than this SDK build. ${update}\n\n${e.message}`
  }
  if (e instanceof KnsError) return e.message // ApiError, TimeoutError, NodeError, …: the message is readable
  return e instanceof Error ? e.message : String(e) // not the SDK's: a wallet extension, the network, a bug
}
