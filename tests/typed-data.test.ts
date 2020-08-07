import { TypedData, TypedDataTypes, TypedDataUtils } from '../src/typed-data'
import { ethers } from 'ethers'

describe('TypedData', () => {

  test('types', () => {
    const types = {
      'Person': [
        {name: 'name', type: 'string'},
        {name: 'wallet', type: 'address'},
      ],
      'Mail': [
        {name: 'from', type: 'Person'},
        {name: 'to', type: 'Person'},
        {name: 'contents', type: 'string'},
        {name: 'asset', type: 'Asset'},
      ],
      'Asset': [
        {name: 'name', type: 'string'}
      ]
    }

    const encodeType = TypedDataUtils.encodeType(types, 'Person')
    expect(encodeType).toEqual('Person(string name,address wallet)')

    const typeHash = TypedDataUtils.typeHash(types, 'Person')
    const typeHashHex = ethers.utils.hexlify(typeHash)
    expect(typeHashHex).toEqual('0xb9d8c78acf9b987311de6c7b45bb6a9c8e1bf361fa7fd3467a2163f994c79500')

    const encodeType2 = TypedDataUtils.encodeType(types, 'Mail')
    expect(encodeType2).toEqual('Mail(Person from,Person to,string contents,Asset asset)Asset(string name)Person(string name,address wallet)')
  })

  test('encoding-1', () => {
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

    const domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
    const domainHashHex = ethers.utils.hexlify(domainHash)
    expect(domainHashHex).toEqual('0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')

    const digest = TypedDataUtils.encodeDigest(typedData)
    const digestHex = ethers.utils.hexlify(digest)
    expect(digestHex).toEqual('0x0a94cf6625e5860fc4f330d75bcd0c3a4737957d2321d1a024540ab5320fe903')
  })

  test('encoding-2', () => {
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
          {name: 'count', type: 'uint8'}
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
        'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        'count': 4
      }
    }

    const domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
    const domainHashHex = ethers.utils.hexlify(domainHash)
    expect(domainHashHex).toEqual('0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')

    const digest = TypedDataUtils.encodeDigest(typedData)
    const digestHex = ethers.utils.hexlify(digest)
    expect(digestHex).toEqual('0x2218fda59750be7bb9e5dfb2b49e4ec000dc2542862c5826f1fe980d6d727e95')
  })

})
