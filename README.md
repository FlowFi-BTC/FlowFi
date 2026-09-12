# FlowFi-BTC — sBTC Capital Settlement Rail

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/296891105?s=200&v=4" height="100px" alt="FlowFi Logo"/>
  <h1 align="center">FlowFi-BTC</h1>
  <p align="center"><b>Bitcoin-Native Capital Settlement Rail for Real-World Trade Receivables</b></p>
</div>

<div align="center">
  <a href="https://stacks.co/"><img src="https://img.shields.io/badge/Network-Stacks%20Testnet-6B46C1?style=for-the-badge&logo=stacks"/></a>
  <a href="https://btc.us/"><img src="https://img.shields.io/badge/Asset-sBTC%20Native-F7931A?style=for-the-badge&logo=bitcoin"/></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript"/></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite"/></a>
</div>

---

## 📌 What is FlowFi?

**FlowFi** (FlowFi-BTC) is an institutional-grade, Bitcoin-native capital settlement rail built on the Stacks blockchain. It enables real-world businesses to unlock working capital by financing verified trade receivables directly through **sBTC** liquidity pools.

By bridging supply chain financing with trust-minimized Bitcoin smart contracts, FlowFi allows sBTC holders to earn sustainable yield (avg. ~9.8% APY) backed by real-economy commercial cash flows.

---

## ✨ Key Features & User Flow

FlowFi implements an end-to-end 8-stage UI & smart contract workflow:

1. **Public Marketing & Landing Page (`/`)**
   - Public onboarding hero banner (*"Unlock Working Capital with sBTC Liquidity"*).
   - Live pilot statistics ($2.4M+ Receivables Financed, 34.5 sBTC Deployed, 9.8% APY).
   - 4-step interactive *"How It Works"* breakdown and featured live testnet receivable preview.

2. **App Dashboard (`/dashboard`)**
   - Control panel for logged-in users tracking account overviews, recent contract activity, and quick submit prompts.

3. **Submit Receivable (`/submit-receivable`)**
   - Interactive 5-step registration wizard:
     1. Business Profile & Representative Details
     2. Receivable Invoice Amount (sBTC & USD) & Target Block Height
     3. Counterparty / Debtor Credentials
     4. Off-Chain SHA-256 Document Hashing (`doc-hash`)
     5. Final Review & Contract Registration

4. **Verification Status (`/verification`)**
   - Compliance attestation tracker showing off-chain document integrity records, reviewer node identities, SHA-256 hashes, and verification progress timelines.

5. **Receivable Detail (`/receivable/:id`)**
   - On-chain Clarity contract state breakdown: borrower principal, capital provider principal, due block height target, and interactive state transition controls.

6. **Funding Flow Confirmation Modal**
   - On-chain transaction execution modal validating capital provider wallet balances and confirming sBTC transfers into Clarity settlement contract pools.

7. **Active Funding Portfolio (`/funding`)**
   - Portfolio management view displaying active capital positions, total sBTC deployed, completed repayments, and default statistics.

8. **Transparency & Public Audit Log (`/history`)**
   - Public chronological index of all Stacks testnet contract events, block heights, and transaction hashes for 100% on-chain auditability.

9. **Settings & Developer Tools (`/settings`)**
   - Stacks node RPC configuration, network environment toggle (Testnet vs. Mainnet preview), Leather/Xverse wallet status, and demo state reset controls.

---

## 🛠️ Smart Contract Architecture

The core settlement engine runs on the Stacks Clarity smart contract (`flowfi-escrow.clar`).

### State Machine Lifecycle
```
[ Registered (0) ]  ──(Fund sBTC)──>  [ Funded (1) ]  ──(Repay)───>  [ Repaid (2) ]
                                           │
                                           └──(Default)──>  [ Defaulted (3) ]
```

- **Registered (`0`)**: Invoice registered on-chain with doc-hash and target due block height.
- **Funded (`1`)**: Capital provider transfers sBTC to the receivable smart contract pool.
- **Repaid (`2`)**: Debtor settles invoice amount plus yield upon maturity; sBTC is released to provider.
- **Defaulted (`3`)**: Event recorded on-chain if repayment target block passes without settlement.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v20.19+ or v22.12+
- **Package Manager**: `npm` (or `pnpm` / `yarn`)

### Installation

```bash
# Clone the repository
git clone https://github.com/FlowFi-BTC/FlowFi.git
cd FlowFi

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Compile TypeScript & Build Production Assets
npm run build
```

---

## 🎨 Tech Stack & Design Aesthetics

- **Framework**: [React 19](https://react.dev/) + [Vite 7](https://vite.dev/)
- **Language**: [TypeScript 5.8](https://www.typescriptlang.org/) (Strict `verbatimModuleSyntax`)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + Neo-brutalist custom design system (`font-syne`, tactile neo-borders, dynamic drop shadows, high-contrast vibrant palette)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Blockchain Integration**: Stacks Testnet Clarity Smart Contracts, sBTC micro-units, Leather & Xverse Wallet connectors.

---

## 📄 License

Open source under the [MIT License](LICENSE).
