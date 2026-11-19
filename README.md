# KNS SDK sample page

A small web page that teaches the [KNS SDK](https://github.com/KaspaNameService/kns-sdk-docs): `.kas` names on
Kaspa. It is for developers adding KNS to a wallet, a marketplace or a dApp. Each SDK capability is one section on
the page, with the code that does it right next to its result. The code you see is the real source file, so you can
copy it as it is.

Vite and TypeScript, no framework, so the SDK calls stay in focus. It runs on Kaspa **testnet-10**.

## Prerequisites

- Node.js 22.12 or later.
- For the write sections (5 to 10): [KasWare](https://kasware.xyz) or [Kastle](https://kastle.cc), switched to
  testnet-10.
- Testnet KAS from the [faucet](https://faucet-tn10.kaspanet.io). Registering a name of 5 or more characters needs
  about 37 KAS in the wallet.

## Quick start

```bash
git clone https://github.com/KaspaNameService/kns-sample-page.git
cd kns-sample-page
npm install
npm run dev
```

Open the address Vite prints. Sections 1 to 4 only read and work right away. To try the writes, connect a wallet in
section 5. Every write shows what the wallet will be asked to sign, and signs only after you confirm.

Other scripts: `npm run build` (to `dist/`), `npm run preview` (serves the build), `npm run typecheck`.

The page picks a public testnet-10 node for the writes. To use your own (with `--utxoindex`), put
`VITE_KASPA_NODE_URL=wss://…/kaspa/testnet-10/wrpc/borsh` in a `.env.local` file.

## Project structure

```text
index.html                  the page shell
src/
  kns.ts                    the reader and the writer: the one place they are made
  examples/                 one file per section, each exporting one function
    01-send-to-name.ts
    02-user-names.ts
    03-check-name.ts
    04-marketplace.ts
    05-connect-wallet.ts
    06-register.ts
    07-transfer.ts
    08-primary-name.ts
    09-list-for-sale.ts
    10-buy.ts
    errors.ts               any SDK error as a readable message
    write-ui.ts             what the write examples share: the confirm hook, and the wait for the tracker
  main.ts                   builds the sections and shows each example's source (Vite's ?raw)
  style.css
```

## Sections

| #   | Section                 | File                                 | SDK call                                                       |
| --- | ----------------------- | ------------------------------------ | -------------------------------------------------------------- |
| 1   | Send to a name          | `src/examples/01-send-to-name.ts`    | `kns.recipientFor`                                             |
| 2   | A user's names          | `src/examples/02-user-names.ts`      | `kns.classify`, `kns.primaryNameFor`, `kns.namesOf`            |
| 3   | Check a name            | `src/examples/03-check-name.ts`      | `kns.quote`, `kns.available`, `kns.lookup`                     |
| 4   | Marketplace             | `src/examples/04-marketplace.ts`     | `kns.listings({ sort, partner })`                              |
| 5   | Connect a wallet        | `src/examples/05-connect-wallet.ts`  | `kaswareSigner`, `kastleSigner`, `new KnsTx` (in `src/kns.ts`) |
| 6   | Register a name         | `src/examples/06-register.ts`        | `kns.quote`, `tx.registerName`, `tx.waitForIndex`              |
| 7   | Transfer a name         | `src/examples/07-transfer.ts`        | `tx.planTransfer`, `tx.submit`                                 |
| 8   | Primary name            | `src/examples/08-primary-name.ts`    | `tx.planSetPrimary`, `tx.planClearPrimary`                     |
| 9   | List for sale, cancel   | `src/examples/09-list-for-sale.ts`   | `tx.planList` with `partnerFee`, `tx.planCancel`               |
| 10  | Buy a listed name       | `src/examples/10-buy.ts`             | `kns.resolveName`, `tx.planBuy({ expectedPriceSompi })`        |
| –   | Write helpers           | `src/examples/write-ui.ts`           | `WriteUi`, `tx.waitForIndex` (a time-out is not a failure)     |
| –   | Errors                  | `src/examples/errors.ts`             | `KnsError`, `KnsTxError.code`                                  |

`kns` is the reader (`@knsdomains/sdk`); `tx` is the writer (`@knsdomains/sdk-tx`). Every spend of a name you hold
is a plan, then `submit`: the plan checks everything with nothing signed, and its `summary` is what the user confirms.
After the send, every write waits for the tracker with `waitForTracker` (`src/examples/write-ui.ts`): when the tracker
is slow, the result still carries the txid and says the transaction is on its way, never that it failed.

## Learn more

- The SDK docs: [quickstart](https://github.com/KaspaNameService/kns-sdk-docs/blob/main/quickstart.md),
  [wallet integration guide](https://github.com/KaspaNameService/kns-sdk-docs/blob/main/wallet-integration.md),
  [signing KNS transactions](https://github.com/KaspaNameService/kns-sdk-docs/blob/main/wallet-signing.md).
- On npm: [`@knsdomains/sdk`](https://www.npmjs.com/package/@knsdomains/sdk),
  [`@knsdomains/sdk-tx`](https://www.npmjs.com/package/@knsdomains/sdk-tx),
  [`@knsdomains/wasm`](https://www.npmjs.com/package/@knsdomains/wasm).

## Notes

- **Testnet only.** KNS runs on testnet-10; mainnet is not deployed yet. Testnet KAS has no value.
- **A new lineage means an SDK update.** The package version names the deployment it was built for
  (`0.1.0-tn10.4d10952e`: lineage `4d10952e`). When testnet moves to a new lineage, the reader refuses the tracker
  with `RegistryMismatchError`: install the new version of both packages, with `--save-exact`.
- **ES modules only.** The packages ship no CommonJS: keep `"type": "module"`.
- `@knsdomains/wasm` comes with `@knsdomains/sdk-tx` at the version it was tested with. With npm, do not install it
  yourself: `src/kns.ts` imports it from where npm put it. It is 8.9 MB (3.9 MB gzipped), so the page loads it only
  when a wallet connects.
- **pnpm or Yarn Plug'n'Play:** these let code import only the packages its own `package.json` declares, so the
  import in `src/kns.ts` fails with _Cannot find module '@knsdomains/wasm'_. Add `@knsdomains/wasm` to your
  dependencies at the exact version `@knsdomains/sdk-tx` depends on (`npm ls @knsdomains/wasm` shows it;
  `9.0.1-src.f785b05` for this SDK version), with `--save-exact`. With pnpm, `public-hoist-pattern[]=@knsdomains/wasm`
  in `.npmrc` also works.
- Vite 8 needs no configuration for the wasm. On Vite 6 or 7, add
  `optimizeDeps: { exclude: ['@knsdomains/wasm'] }` to `vite.config`, or the dev server cannot load it.

## License

[MIT](LICENSE)
