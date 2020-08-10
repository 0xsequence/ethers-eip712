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

  test('encoding-3', () => {
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallets', type: 'address[]' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
        ],
        Group: [
          { name: 'name', type: 'string' },
          { name: 'members', type: 'Person[]' },
        ],
      },
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      primaryType: 'Mail' as const,
      message: {
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [{
          name: 'Bob',
          wallets: [
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
            '0xB0B0b0b0b0b0B000000000000000000000000000',
          ],
        }],
        contents: 'Hello, Bob!',
      },
    }

    expect(
      TypedDataUtils.encodeType(typedData.types, 'Group')
    ).toEqual('Group(string name,Person[] members)Person(string name,address[] wallets)')

    expect(
      TypedDataUtils.encodeType(typedData.types, 'Person')
    ).toEqual('Person(string name,address[] wallets)')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.typeHash(typedData.types, 'Person')
      )
    ).toEqual('0xfabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.encodeData(typedData, 'Person', typedData.message.from)
      )
    ).toEqual(
      `0x${[
        'fabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860',
        '8c1d2bd5348394761719da11ec67eedae9502d137e8940fee8ecd6f641ee1648',
        '8a8bfe642b9fc19c25ada5dadfd37487461dc81dd4b0778f262c163ed81b5e2a',
      ].join('')}`
    )

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.hashStruct(typedData, 'Person', typedData.message.from)
      )
    ).toEqual('0x9b4846dd48b866f0ac54d61b9b21a9e746f921cefa4ee94c4c0a1c49c774f67f')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.encodeData(typedData, 'Person', typedData.message.to[0])
      )
    ).toEqual(
      `0x${[
        'fabfe1ed996349fc6027709802be19d047da1aa5d6894ff5f6486d92db2e6860',
        '28cac318a86c8a0a6a9156c2dba2c8c2363677ba0514ef616592d81557e679b6',
        'd2734f4c86cc3bd9cabf04c3097589d3165d95e4648fc72d943ed161f651ec6d',
      ].join('')}`
    )

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.hashStruct(typedData, 'Person', typedData.message.to[0])
      )
    ).toEqual('0xefa62530c7ae3a290f8a13a5fc20450bdb3a6af19d9d9d2542b5a94e631a9168')

    expect(
      TypedDataUtils.encodeType(typedData.types, 'Mail')
    ).toEqual('Mail(Person from,Person[] to,string contents)Person(string name,address[] wallets)')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.typeHash(typedData.types, 'Mail')
      )
    ).toEqual('0x4bd8a9a2b93427bb184aca81e24beb30ffa3c747e2a33d4225ec08bf12e2e753')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.encodeData(typedData, typedData.primaryType, typedData.message)
      )
    ).toEqual(
      `0x${[
        '4bd8a9a2b93427bb184aca81e24beb30ffa3c747e2a33d4225ec08bf12e2e753',
        '9b4846dd48b866f0ac54d61b9b21a9e746f921cefa4ee94c4c0a1c49c774f67f',
        'ca322beec85be24e374d18d582a6f2997f75c54e7993ab5bc07404ce176ca7cd',
        'b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8',
      ].join('')}`
    )

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.hashStruct(typedData, typedData.primaryType, typedData.message)
      )
    ).toEqual('0xeb4221181ff3f1a83ea7313993ca9218496e424604ba9492bb4052c03d5c3df8')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
      )
    ).toEqual('0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')

    expect(
      ethers.utils.hexlify(
        TypedDataUtils.encodeDigest(typedData)
      )
    ).toEqual('0xa85c2e2b118698e88db68a8105b794a8cc7cec074e89ef991cb4f5f533819cc2')
  })

  test('encoding-4', () => {
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
          {name: 'count', type: 'bytes8'}
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
        'count': '0x1122334455667788'
      }
    }

    const domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
    const domainHashHex = ethers.utils.hexlify(domainHash)
    expect(domainHashHex).toEqual('0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')

    const digest = TypedDataUtils.encodeDigest(typedData)
    const digestHex = ethers.utils.hexlify(digest)
    expect(digestHex).toEqual('0x2a3e64893ed4ba30ea34dbff3b0aa08c7677876cfdf7112362eccf3111f58d1d')
  })
  
  test('encoding-5', () => {
    const typedData = TypedDataUtils.buildTypedData(
      {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
      },
      {
        'Person': [
          {name: "name", type: "string"},
          {name: "wallet", type: "address"},
        ]
      },
      'Person',
      {
        'name': 'Bob',
        'wallet': '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      }
    )

    const domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
    const domainHashHex = ethers.utils.hexlify(domainHash)
    expect(domainHashHex).toEqual('0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f')

    const digest = TypedDataUtils.encodeDigest(typedData)
    const digestHex = ethers.utils.hexlify(digest)
    expect(digestHex).toEqual('0x0a94cf6625e5860fc4f330d75bcd0c3a4737957d2321d1a024540ab5320fe903')
  })

})
