@stacks/connect npm
🛬 Migration Guide
Welcome to the new Stacks Connect! ✨ Read the @stacks/connect docs for more information.

For a while now the Stacks community has been working on a new standard for wallet-to-dapp communication. Stacks Connect and related projects now use standards like WBIPs and SIP-030 to allow wallets to communicate with dapps in a more simplified and flexible way.

⚠️ Deprecations
The following classes, methods, and types are deprecated in favor of the new request RPC methods:

show... and open... methods
authenticate method
UserSession class and related functionality
AppConfig class
SessionOptions interface
SessionData interface
UserData interface
SessionDataStore class
InstanceDataStore class
LocalStorageStore class
Note

To make migrating easier, the familiar UserSession & AppConfig class still exists and is semi-backwards compatible for the 8.x.x release. It will "cache" the user's address in local storage and allow access to it via the loadUserData method (as previously done).

▶️ Migration Steps
To update from <=7.x.x to latest/8.x.x, follow these steps.

Update your @stacks/connect version:
npm install @stacks/connect@latest
Switch from showXyz, openXyz, doXyz methods to the request method.

request follows the pattern request(method: string, params: object), see Usage for more details
request is an async function, so replace the onFinish and onCancel callbacks with .then().catch() or try & await
e.g., showConnect(), authenticate() → connect()
e.g., useConnect().doContractCall({}) → request("stx_callContract", {})
e.g., openContractDeploy() → request("stx_deployContract", {})
Switch from showConnect orauthenticate to connect() methods

connect() is an alias for request({forceWalletSelect: true}, 'getAddresses')
connect() by default caches the user's address in local storage
Remove code referencing deprecated methods (AppConfig, UserSession, etc.)

Switch from UserSession.isSignedIn() to isConnected()
Switch from UserSession.signUserOut() to disconnect()
Remove the @stacks/connect-react package.

You may need to manually reload a component to see local storage updates.
No custom hooks are needed to use Stacks Connect anymore.
We are working on a new @stacks/react package that will make usage even easier in the future (e.g. tracking transaction status, reloading components when a connection is established, updating the page when the network changes, and more).
🪪 Address Access
Previously, the UserSession class was used to access the user's addresses and data, which abstracted away the underlying implementation details. Now, the request method is used to directly interact with the wallet, giving developers more explicit control and clarity over what's happening under the hood. This manual approach makes the wallet interaction more transparent and customizable. Developer can manually manage the currently connected user's address in e.g. local storage, jotai, etc. or use the connect()/request() method to cache the address in local storage.

Important

For security reasons, the 8.x.x release only returns the current network's address (where previously both mainnet and testnet addresses were returned).

Usage
Try the Connect Method Demo App 🌏 to see which methods/features are available for wallets

Install @stacks/connect
npm install @stacks/connect
pnpm install @stacks/connect
yarn add @stacks/connect
Connect to a wallet
Initiate a wallet connection and request addresses.

import { connect } from '@stacks/connect';

const response = await connect(); // stores users address in local storage by default
Get the local storage data (stored by a connect call).

import { getLocalStorage } from '@stacks/connect';

const data = getLocalStorage();
// {
//   "addresses": {
//     "stx": [
//       { "address": "SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN" },
//     ],
//     "btc": [
//       { "address": "bc1pp3ha248m0mnaevhp0txfxj5xaxmy03h0j7zuj2upg34mt7s7e32q7mdfae" },
//     ]
//   }
Managing the connection state.

import { connect, disconnect, isConnected } from '@stacks/connect';

isConnected(); // false
await connect(); // similar to the `getAddresses` method
isConnected(); // true
disconnect(); // clears local storage and selected wallet
isConnected(); // false
WalletConnect
To use WalletConnect as a provider configure the walletConnectProjectId option in the connect/request params.

await connect({ walletConnectProjectId: 'YOUR_PROJECT_ID' });
You can get your project ID from the Reown dashboard after creating an App project.

Use request to trigger wallet interactions
import { request } from '@stacks/connect';

// CONNECT
const response = await request({ forceWalletSelect: true }, 'getAddresses');
Available methods
getAddresses
sendTransfer
signPsbt
stx_getAddresses
stx_getAccounts
stx_transferStx
stx_callContract
stx_deployContract
stx_signMessage
stx_signStructuredMessage
getAddresses
const response = await request('getAddresses');
// {
//   "addresses": [
//     {
//       "address": "bc1pp3ha248m0mnaevhp0txfxj5xaxmy03h0j7zuj2upg34mt7s7e32q7mdfae",
//       "publicKey": "062bd2c825300d74f4f9feb6b2fec2590beac02b8938f0fc042a34254581ee69",
//     },
//     {
//       "address": "bc1qtmqe7hg4etkq4t384nzg0mrmwf2sam9fjsz0mr",
//       "publicKey": "025b65a0ec0e00699794847f2af1b5d8a53db02a2f48e09417598bef09cfea1114",
//     },
//     {
//       "address": "SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN",
//       "publicKey": "02d3331cbb9f72fe635e6f87c2cf1a13cdea520f08c0cc68584a96e8ac19d8d304",
//     }
//   ]
// }
sendTransfer
const response = await request('sendTransfer', {
  recipients: [
    {
      address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // recipient address
      amount: '1000', // amount in sats
    },
    // You can specify multiple recipients
    {
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      amount: '2000',
    },
  ],
});
// {
//   "txid": "0x1234...", // The transaction ID
// }
signPsbt
const response = await request('signPsbt', {
  psbt: 'cHNidP...', // base64 encoded PSBT string
  signInputs: [{ index: 0, address }], // indices of inputs to sign (optional)
  broadcast: false, // whether to broadcast the transaction after signing (optional)
});
// {
//   "txid": "0x1234...", // The transaction ID (if broadcast is true)
//   "psbt": "cHNidP..." // The signed PSBT in base64 format
// }
stx_getAddresses
const response = await request('stx_getAddresses');
// {
//   "addresses": [
//     {
//       "address": "bc1pp3ha248m0mnaevhp0txfxj5xaxmy03h0j7zuj2upg34mt7s7e32q7mdfae",
//       "publicKey": "062bd2c825300d74f4f9feb6b2fec2590beac02b8938f0fc042a34254581ee69",
//     },
//     {
//       "address": "bc1qtmqe7hg4etkq4t384nzg0mrmwf2sam9fjsz0mr",
//       "publicKey": "025b65a0ec0e00699794847f2af1b5d8a53db02a2f48e09417598bef09cfea1114",
//     },
//     {
//       "address": "SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN",
//       "publicKey": "02d3331cbb9f72fe635e6f87c2cf1a13cdea520f08c0cc68584a96e8ac19d8d304",
//     }
//   ]
// }
stx_getAccounts
const response = await request('stx_getAccounts');
// {
//   "addresses": [
//     {
//       "address": "SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN",
//       "publicKey": "02d3331cbb9f72fe635e6f87c2cf1a13cd...",
//       "gaiaHubUrl": "https://hub.hiro.so",
//       "gaiaAppKey": "0488ade4040658015580000000dc81e3a5..."
//     }
//   ]
// }
stx_transferStx
const response = await request('stx_transferStx', {
  amount: '1000', // amount in micro-STX (1 STX = 1,000,000 micro-STX)
  recipient: 'SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN', // recipient address
  network: 'mainnet', // optional, defaults to mainnet
  memo: 'Optional memo', // optional memo field
});
// {
//   "txid": "0x1234...", // The transaction ID
// }
stx_callContract
const response = await request('stx_callContract', {
  contract: 'SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN.counters', // contract in format: address.contract-name
  functionName: 'count', // name of the function to call
  functionArgs: [Cl.int(3)], // array of Clarity values as arguments
  network: 'mainnet', // optional, defaults to mainnet
});
// {
//   "txid": "0x1234...", // The transaction ID
// }
stx_deployContract
const response = await request('stx_deployContract', {
  name: 'counters', // name of the contract
  clarityCode: `(define-map counters principal int)

(define-public (count (change int))
  (ok (map-set counters tx-sender (+ (get-count tx-sender) change)))
)

(define-read-only (get-count (who principal))
  (default-to 0 (map-get? counters who))
)`, // Clarity code as string
  clarityVersion: '2', // optional, defaults to latest version
  network: 'mainnet', // optional, defaults to mainnet
});
// {
//   "txid": "0x1234...", // The transaction ID
// }
stx_signMessage
const response = await request('stx_signMessage', {
  message: 'Hello, World!', // message to sign
});
// {
//   "signature": "0x1234...", // The signature of the message
//   "publicKey": "02d3331cbb9f72fe635e6f87c2cf1a13cdea520f08c0cc68584a96e8ac19d8d304" // The public key that signed the message
// }
stx_signStructuredMessage
const clarityMessage = Cl.parse('{ structured: "message", num: u3 }');
const clarityDomain = Cl.tuple({
  domain: Cl.stringAscii('example.com'),
  version: Cl.stringAscii('1.0.0'),
  'chain-id': Cl.uint(1),
});

const response = await request('stx_signStructuredMessage', {
  message: clarityMessage, // Clarity value representing the structured message
  domain: clarityDomain, // domain object for SIP-018 style signing
});
// {
//   "signature": "0x1234...", // The signature of the structured message
//   "publicKey": "02d3331cbb9f72fe635e6f87c2cf1a13cdea520f08c0cc68584a96e8ac19d8d304" // The public key that signed the message
// }
Error Handling
The request method returns a Promise, allowing you to handle errors using standard Promise-based error handling patterns. You can use either try/catch with async/await or the .catch() method with Promise chains.

Using try/catch with async/await
import { request } from '@stacks/connect';

try {
  const response = await request('stx_transferStx', {
    amount: '1000',
    recipient: 'SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN',
  });
  // SUCCESS
  console.log('Transaction successful:', response.txid);
} catch (error) {
  // ERROR
  console.error('Wallet returned an error:', error);
}
Compatibility
The request method by default adds a layer of auto-compatibility for different wallet providers. This is meant to unify the interface where wallet providers may not implement methods and results the same way.

Method		Notes
getAddresses	🔵	Maps to wallet_connect for Xverse-like wallets
sendTransfer	🔵	Converts amount to number for Xverse, string for Leather
signPsbt	🟡	Transforms PSBT format for Leather (base64 to hex) with lossy restructure of signInputs
stx_getAddresses	🔵	Maps to wallet_connect for Xverse-like wallets
stx_getAccounts	🟢	
stx_getNetworks	🟢	
stx_transferStx	🟢	
stx_transferSip10Ft	🟢	
stx_transferSip9Nft	🟢	
stx_callContract	🔵	Transforms Clarity values to hex-encoded format for compatibility
stx_deployContract	🔵	Transforms Clarity values to hex-encoded format for compatibility
stx_signTransaction	🔵	Transforms Clarity values to hex-encoded format for compatibility
stx_signMessage	🔵	Transforms Clarity values to hex-encoded format for compatibility
stx_signStructuredMessage	🔵	Transforms Clarity values to hex-encoded format for compatibility
stx_updateProfile	🟢	
stx_accountChange (event)	🟢	
stx_networkChange (event)	🟢	
🟢 No overrides needed for any wallet
🔵 Has compatibility overrides that maintain functionality
🟡 Has breaking overrides that may lose some information
To disable this behavior, you can set the enableOverrides option to false or use the requestRaw method detailed below.

Advanced Usage
request
The request method is called with an optional options object as the first parameter:

import { request } from '@stacks/connect';

// WITH options
const response = await request(
  {
    provider?: StacksProvider;         // Custom provider to use for the request

    forceWalletSelect?: boolean;       // Force user to select a wallet (default: false)
    persistWalletSelect?: boolean;     // Persist selected wallet (default: true)
    enableOverrides?: boolean;         // Enable provider compatibility (default: true)
    enableLocalStorage?: boolean;      // Store address in local storage (default: true)

    defaultProviders?: WbipProvider[]; // Default wallets to display in modal
    approvedProviderIds?: string[];    // List of approved provider IDs to show in modal

    walletConnect?: {
      projectId: string;               // WalletConnect project ID
      // ... other options from WalletConnect `UniversalConnectorConfig` (from `@reown/appkit-universal-connector`)
    };
  },
  'method',
  params
);

// WITHOUT options
const response = await request('method', params);
The enableOverrides option enables automatic compatibility fixes for different wallet providers. For example, it handles converting numeric types between string and number formats as needed by different wallets, and remaps certain method names to match wallet-specific implementations. This ensures consistent behavior across different wallet providers without requiring manual adjustments.

The approvedProviderIds option allows you to filter which wallet providers are shown in the connect modal. This is useful when you want to limit the available wallet options to specific providers. For example, you might only want to support Leather wallet:

connect({ approvedProviderIds: ['LeatherProvider'] });
Or multiple specific wallets:

connect({ approvedProviderIds: ['LeatherProvider', 'xverse'] });
requestRaw
The requestRaw method provides direct access to wallet providers without the additional features of request:

import { requestRaw } from '@stacks/connect';

const response = await requestRaw(provider, 'method', params);
Note: requestRaw bypasses the UI wallet selector, automatic provider compatibility fixes, and other features that come with request. Use this when you need more manual control over the wallet interaction process.

Support
Here's a list of methods and events that are supported by popular wallets:

Method	Leather	Xverse-like
getAddresses	🟡 No support for experimental purpose	🟡 Use wallet_connect instead
sendTransfer	🟡 Expects amount as string	🟡 Expects amount as number
signPsbt	🟡 Uses signing index array only	🟡 Uses signInputs record instead of array
stx_getAddresses	🟢	🔴
stx_getAccounts	🔴	🟢
stx_getNetworks	🔴	🔴
stx_transferStx	🟢	🟢
stx_transferSip10Ft	🟢	🔴
stx_transferSip9Nft	🟢	🔴
stx_callContract	🟡 Hex-encoded Clarity values & post-conditions only	🟡 Hex-encoded Clarity values & post-conditions only, no support for postConditions
stx_deployContract	🟡 Hex-encoded post-conditions only	🟡 Hex-encoded post-conditions only, no support for postConditions
stx_signTransaction	🟢	🟢
stx_signMessage	🟡 No support for non-standard publicKey parameter	🟡 Requires non-standard publicKey parameter
stx_signStructuredMessage	🟡 Hex-encoded Clarity values only	🟡 Hex-encoded Clarity values only
stx_updateProfile	🔴	🔴
Event	Leather	Xverse
stx_accountChange	🔴	🔴
stx_networkChange	🔴	🔴
🔴 No support (yet)
🟡 Partial support
🟢 Supported