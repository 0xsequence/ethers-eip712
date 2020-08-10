ethers-eip712
=============

`ethers-eip712` is an npm package that implements the Ethereum Typed Data (EIP712)
for structured data hashing and signing proposal, written in TypeScript for ethers.js.

EIP712: https://eips.ethereum.org/EIPS/eip-712

## Usage

`yarn install ethers-eip712` or `npm install ethers-eip712`

NOTE: both ethers v4 and ethers v5 are compatible by this single library.


## Example

```typescript
import { ethers } from 'ethers'
import { TypedDataUtils } from 'ethers-eip712'

const typedData = {
  types: {
    EIP712Domain: [
      {name: "name", type: "string"},
      {name: "version", type: "string"},
      {name: "chainId", type: "uint256"},
      {name: "verifyingContract", type: "address"},
    ],
    Person: [
      {name: "name", type: "string"},
      {name: "wallet", type: "address"},  
    ]
  },
  primaryType: 'Person' as const,
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  message: {
    'name': 'Bob',
    'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
  }
}

const digest = TypedDataUtils.encodeDigest(typedData)
const digestHex = ethers.utils.hexlify(digest)

const wallet = ethers.Wallet.createRandom()
const signature = wallet.signMessage(digest)
```

[See tests for more examples](./tests/typed-data.test.ts)


## License

MIT
