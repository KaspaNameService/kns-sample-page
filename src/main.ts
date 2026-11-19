/**
 * The page around the examples. Nothing here is KNS-specific: it builds one section per example from the list
 * below, runs the example when you press its button, shows what it returns, and shows the example's own source
 * (imported with Vite's `?raw`, so the code you read is the code that ran).
 *
 * The SDK calls are all in src/kns.ts and src/examples/. Start there.
 */
import './style.css'
import { kns } from './kns'
import { explainError } from './examples/errors'
import type { WriteUi } from './examples/write-ui'

import { sendToName } from './examples/01-send-to-name'
import { namesOfAddress } from './examples/02-user-names'
import { checkName } from './examples/03-check-name'
import { browseListings } from './examples/04-marketplace'
import { connectWallet, detectWallets } from './examples/05-connect-wallet'
import { registerName } from './examples/06-register'
import { transferName } from './examples/07-transfer'
import { changePrimaryName } from './examples/08-primary-name'
import { cancelListing, listForSale } from './examples/09-list-for-sale'
import { buyName } from './examples/10-buy'

import sendToNameCode from './examples/01-send-to-name.ts?raw'
import userNamesCode from './examples/02-user-names.ts?raw'
import checkNameCode from './examples/03-check-name.ts?raw'
import marketplaceCode from './examples/04-marketplace.ts?raw'
import connectCode from './examples/05-connect-wallet.ts?raw'
import registerCode from './examples/06-register.ts?raw'
import transferCode from './examples/07-transfer.ts?raw'
import primaryCode from './examples/08-primary-name.ts?raw'
import listCode from './examples/09-list-for-sale.ts?raw'
import buyCode from './examples/10-buy.ts?raw'
import errorsCode from './examples/errors.ts?raw'
import writeUiCode from './examples/write-ui.ts?raw'
import knsCode from './kns.ts?raw'

type Values = Record<string, string>

interface Field {
  key: string
  label: string
  value?: string
  placeholder?: string
  /** A <select> of [value, label] pairs instead of a text input. */
  options?: [string, string][]
  wide?: boolean
}

interface Action {
  label: string
  run: (values: Values, ui: WriteUi) => Promise<unknown>
}

interface Section {
  id: string
  title: string
  /** One sentence. Static HTML from this file (links), never user input. */
  intro: string
  file: string
  code: string
  fields: Field[]
  actions: Action[]
  wallet?: boolean
}

const SAMPLE_ADDRESS = 'kaspatest:qq5d6rgy3tvzl3v7x5uzkvf9ty70zf7eqva967dakm7eg3jgpx7gc78tq4xp2'
const DOCS = 'https://github.com/KaspaNameService/kns-sdk-docs/blob/main'

const SECTIONS: Section[] = [
  {
    id: 'send-to-name',
    title: '1. Send to a name',
    intro: 'Turn what a user typed (a name, a subdomain or an address) into the one address to pay, or a reason not to.',
    file: 'src/examples/01-send-to-name.ts',
    code: sendToNameCode,
    fields: [{ key: 'input', label: 'Name or address', value: 'alice.kas' }],
    actions: [{ label: 'Run', run: (v) => sendToName(v.input ?? '') }],
  },
  {
    id: 'user-names',
    title: "2. A user's names",
    intro: 'Show the primary name an address chose, and list every name it holds.',
    file: 'src/examples/02-user-names.ts',
    code: userNamesCode,
    fields: [{ key: 'address', label: 'Address', value: SAMPLE_ADDRESS, wide: true }],
    actions: [{ label: 'Run', run: (v) => namesOfAddress(v.address ?? '') }],
  },
  {
    id: 'check-name',
    title: '3. Check a name',
    intro: 'Is a name available or taken, and what does registering it cost?',
    file: 'src/examples/03-check-name.ts',
    code: checkNameCode,
    fields: [{ key: 'name', label: 'Name', value: 'alice.kas' }],
    actions: [{ label: 'Run', run: (v) => checkName(v.name ?? '') }],
  },
  {
    id: 'marketplace',
    title: '4. Marketplace',
    intro: 'Browse the names for sale, sorted, optionally by marketplace partner, with each price and partner fee.',
    file: 'src/examples/04-marketplace.ts',
    code: marketplaceCode,
    fields: [
      {
        key: 'sort',
        label: 'Sort',
        options: [
          ['price_asc', 'Price, low to high'],
          ['price_desc', 'Price, high to low'],
          ['listed_newest', 'Newest listing first'],
          ['listed_oldest', 'Oldest listing first'],
        ],
      },
      {
        key: 'filter',
        label: 'Partner',
        options: [
          ['', 'All listings'],
          ['none', 'No partner fee (partner=none)'],
          ['address', 'One partner (address below)'],
        ],
      },
      { key: 'partner', label: 'Partner address', placeholder: 'kaspatest:…', wide: true },
    ],
    actions: [
      {
        label: 'Run',
        run: (v) => {
          const partner = v.filter === 'address' ? (v.partner ?? '').trim() : (v.filter ?? '')
          // An empty address would mean "no filter": say so, rather than show every listing as if filtered.
          if (v.filter === 'address' && !partner) throw new Error('Enter the partner address, or pick All listings.')
          return browseListings((v.sort ?? 'price_asc') as Parameters<typeof browseListings>[0], partner)
        },
      },
    ],
  },
  {
    id: 'connect',
    title: '5. Connect a wallet',
    intro:
      `Connect KasWare or Kastle on testnet-10. Managing a name needs a wallet that also signs the name's ` +
      `covenant input; the <a href="${DOCS}/wallet-signing.md" target="_blank" rel="noopener">signing spec</a> says what that means.`,
    file: 'src/examples/05-connect-wallet.ts',
    code: connectCode,
    fields: [],
    actions: [
      { label: 'Connect KasWare', run: () => connectWallet('kasware').then(onConnected) },
      { label: 'Connect Kastle', run: () => connectWallet('kastle').then(onConnected) },
    ],
  },
  {
    id: 'register',
    title: '6. Register a name',
    intro: 'Quote the name, confirm the cost, then register it in one transaction.',
    file: 'src/examples/06-register.ts',
    code: registerCode,
    wallet: true,
    fields: [{ key: 'name', label: 'Name', placeholder: 'my-new-name.kas' }],
    actions: [{ label: 'Run', run: (v, ui) => registerName(v.name ?? '', ui) }],
  },
  {
    id: 'transfer',
    title: '7. Transfer a name',
    intro: 'Send a name you hold to another address: plan, confirm, submit.',
    file: 'src/examples/07-transfer.ts',
    code: transferCode,
    wallet: true,
    fields: [
      { key: 'name', label: 'Your name', placeholder: 'alice.kas' },
      { key: 'to', label: 'Recipient address', placeholder: 'kaspatest:…', wide: true },
    ],
    actions: [{ label: 'Run', run: (v, ui) => transferName(v.name ?? '', v.to ?? '', ui) }],
  },
  {
    id: 'primary',
    title: '8. Set or clear the primary name',
    intro: 'Choose the one name your address shows (what section 2 reads), or stop showing it.',
    file: 'src/examples/08-primary-name.ts',
    code: primaryCode,
    wallet: true,
    fields: [
      { key: 'name', label: 'Your name', placeholder: 'alice.kas' },
      { key: 'action', label: 'Action', options: [['set', 'Set as primary'], ['clear', 'Clear primary']] },
    ],
    actions: [
      { label: 'Run', run: (v, ui) => changePrimaryName(v.name ?? '', v.action === 'clear' ? 'clear' : 'set', ui) },
    ],
  },
  {
    id: 'list',
    title: '9. List for sale, and cancel',
    intro: 'List a name, optionally with a partner fee for your marketplace, see the split before signing, or cancel.',
    file: 'src/examples/09-list-for-sale.ts',
    code: listCode,
    wallet: true,
    fields: [
      { key: 'name', label: 'Your name', placeholder: 'alice.kas' },
      { key: 'price', label: 'Price (KAS)', value: '25' },
      { key: 'partner', label: 'Partner fee address (optional)', placeholder: 'kaspatest:…', wide: true },
      { key: 'bps', label: 'Partner fee (basis points)', value: '250' },
    ],
    actions: [
      { label: 'List', run: (v, ui) => listForSale(v.name ?? '', v.price ?? '', v.partner ?? '', v.bps ?? '', ui) },
      { label: 'Cancel listing', run: (v, ui) => cancelListing(v.name ?? '', ui) },
    ],
  },
  {
    id: 'buy',
    title: '10. Buy a listed name',
    intro: 'Buy a name at the price you saw; the plan refuses if the listing changed.',
    file: 'src/examples/10-buy.ts',
    code: buyCode,
    wallet: true,
    fields: [
      { key: 'name', label: 'Listed name', placeholder: 'see section 4' },
      { key: 'saw', label: 'Price you saw (KAS, optional)', placeholder: 'the current price' },
    ],
    actions: [{ label: 'Run', run: (v, ui) => buyName(v.name ?? '', v.saw ?? '', ui) }],
  },
]

// ---------------------------------------------------------------------------------------------- rendering

/** `h('p', { class: 'x' }, 'text', child)`: a tiny element helper, so the page needs no framework. */
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  el.append(...children)
  return el
}

/** JSON for the output panel. Amounts are already text in the examples; a stray bigint is shown as digits. */
function toJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v), 2)
}

function showResult(out: HTMLElement, result: unknown) {
  out.className = 'output'
  if (result === null) {
    out.replaceChildren(h('p', { class: 'show' }, 'Cancelled. Nothing was signed.'))
    return
  }
  if (result && typeof result === 'object' && 'show' in result && typeof result.show === 'string') {
    const { show, ...rest } = result as { show: string } & Record<string, unknown>
    const parts: Node[] = [h('p', { class: 'show' }, show)]
    if (Object.keys(rest).length > 0) parts.push(h('pre', {}, toJson(rest)))
    out.replaceChildren(...parts)
    return
  }
  out.replaceChildren(h('pre', {}, typeof result === 'string' ? result : toJson(result)))
}

function showError(out: HTMLElement, e: unknown) {
  out.className = 'output error'
  out.replaceChildren(h('pre', {}, explainError(e)))
  console.warn(e) // the full error, with its cause, for you in the console
}

/** The "Show code" block: the example file's own source. */
function codeBlock(file: string, code: string): HTMLElement {
  return h('details', { class: 'code' }, h('summary', {}, `Show code: ${file}`), h('pre', {}, h('code', {}, code)))
}

function renderSection(s: Section): HTMLElement {
  const inputs = new Map<string, HTMLInputElement | HTMLSelectElement>()
  const fieldEls = s.fields.map((f) => {
    const id = `${s.id}-${f.key}`
    const input = f.options
      ? h('select', { id, name: f.key }, ...f.options.map(([value, label]) => h('option', { value }, label)))
      : h('input', { id, name: f.key, type: 'text', spellcheck: 'false', autocomplete: 'off' })
    if (f.placeholder) input.setAttribute('placeholder', f.placeholder)
    if (f.value !== undefined) input.value = f.value
    inputs.set(f.key, input)
    return h('label', { class: f.wide ? 'field wide' : 'field', for: id }, h('span', {}, f.label), input)
  })

  const status = h('p', { class: 'status', 'aria-live': 'polite' })
  const confirmBox = h('div', { class: 'confirm', hidden: '' })
  const out = h('div', { class: 'output empty' }, 'Output appears here.')
  const buttons = s.actions.map((a) => h('button', { type: 'button', 'data-action': a.label }, a.label))

  // The WriteUi the write examples call: a confirm box under the inputs, and a progress line.
  const ui: WriteUi = {
    confirm(summary, ...details) {
      return new Promise<boolean>((resolve) => {
        const yes = h('button', { type: 'button', class: 'primary', 'data-confirm': 'yes' }, 'Confirm and sign')
        const no = h('button', { type: 'button', 'data-confirm': 'no' }, 'Cancel')
        const done = (answer: boolean) => {
          confirmBox.hidden = true
          confirmBox.replaceChildren()
          out.textContent = answer ? 'Running…' : ''
          resolve(answer)
        }
        yes.onclick = () => done(true)
        no.onclick = () => done(false)
        confirmBox.replaceChildren(
          h('p', { class: 'label' }, 'Your wallet will be asked to:'),
          h('p', { class: 'summary' }, summary),
          ...(details.length ? [h('ul', {}, ...details.map((d) => h('li', {}, d)))] : []),
          h('div', { class: 'buttons' }, yes, no),
        )
        confirmBox.hidden = false
        status.textContent = 'Waiting for you to confirm…'
        out.textContent = 'Nothing has been signed. The wallet is asked only after you confirm.'
      })
    },
    progress(text) {
      status.textContent = text
    },
  }

  s.actions.forEach((action, i) => {
    buttons[i]!.addEventListener('click', async () => {
      const values: Values = {}
      for (const [k, el] of inputs) values[k] = el.value
      buttons.forEach((b) => (b.disabled = true))
      out.className = 'output empty'
      out.textContent = 'Running…'
      try {
        showResult(out, await action.run(values, ui))
      } catch (e) {
        showError(out, e)
      } finally {
        status.textContent = ''
        buttons.forEach((b) => (b.disabled = false))
      }
    })
  })

  const intro = h('p', { class: 'intro' })
  intro.innerHTML = s.intro // static strings from SECTIONS only
  return h(
    'section',
    { id: s.id, class: s.wallet ? 'card write' : 'card' },
    h('h2', {}, s.title, ...(s.wallet ? [h('span', { class: 'tag' }, 'wallet')] : [])),
    intro,
    ...(fieldEls.length ? [h('div', { class: 'fields' }, ...fieldEls)] : []),
    h('div', { class: 'buttons' }, ...buttons),
    status,
    confirmBox,
    out,
    codeBlock(s.file, s.code),
  )
}

// ---------------------------------------------------------------------------------------------- wallet chip

const walletChip = document.querySelector<HTMLElement>('#wallet-status')!

/** After section 5 connects: show the account in the header. */
function onConnected<T extends { address: string; wallet: string }>(r: T): T {
  walletChip.textContent = `${r.wallet}: ${r.address.slice(0, 18)}…${r.address.slice(-6)}`
  walletChip.className = 'chip ok'
  return r
}

/** Which wallets are installed. Asked twice: an extension can inject after the page has loaded. */
function showDetectedWallets() {
  const found = detectWallets()
  const note = document.querySelector<HTMLElement>('#connect .status')
  if (note && (!note.textContent || note.textContent.startsWith('Detected:'))) {
    note.textContent = `Detected: KasWare ${found.kasware ? 'yes' : 'no'}, Kastle ${found.kastle ? 'yes' : 'no'}.`
  }
}

// ---------------------------------------------------------------------------------------------- start

const app = document.querySelector<HTMLElement>('#app')!
const nav = document.querySelector<HTMLElement>('#toc')!
for (const s of SECTIONS) {
  app.append(renderSection(s))
  nav.append(h('li', {}, h('a', { href: `#${s.id}` }, s.title)))
}

// Three more source panels with no Run button: the clients, what the write examples share, and the errors.
const PANELS: { id: string; title: string; intro: string; file: string; code: string }[] = [
  {
    id: 'clients',
    title: 'The clients',
    intro: 'Where the reader and the writer are made: one file, imported by every example.',
    file: 'src/kns.ts',
    code: knsCode,
  },
  {
    id: 'write-helpers',
    title: 'Shared by the write examples',
    intro:
      'The confirm and progress hooks sections 6 to 10 call (your app supplies its own dialog), and the wait for ' +
      'the tracker after a send, where a time-out is not a failure.',
    file: 'src/examples/write-ui.ts',
    code: writeUiCode,
  },
  {
    id: 'errors',
    title: 'Errors',
    intro: 'Every section shows its errors through one function that branches on the error codes.',
    file: 'src/examples/errors.ts',
    code: errorsCode,
  },
]
for (const p of PANELS) {
  const intro = h('p', { class: 'intro' }, p.intro)
  app.append(h('section', { id: p.id, class: 'card' }, h('h2', {}, p.title), intro, codeBlock(p.file, p.code)))
  nav.append(h('li', {}, h('a', { href: `#${p.id}` }, p.title)))
}

showDetectedWallets()
setTimeout(showDetectedWallets, 1000)

// The tracker's health, in the header: the reader's first call also checks the tracker serves this registry.
const trackerChip = document.querySelector<HTMLElement>('#tracker-status')!
kns
  .status()
  .then((s) => {
    const ok = s.ready && s.sameRegistry && s.caughtUp
    const problem = !s.sameRegistry ? 'another registry, update the SDK' : s.ready ? 'behind' : 'not ready'
    trackerChip.textContent = ok ? `tracker ready, index ${s.index_age_secs} s behind` : `tracker: ${problem}`
    trackerChip.className = ok ? 'chip ok' : 'chip warn'
  })
  .catch((e: unknown) => {
    trackerChip.textContent = 'tracker unreachable'
    trackerChip.className = 'chip warn'
    trackerChip.title = explainError(e)
  })
