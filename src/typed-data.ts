import { ethers } from 'ethers'

// EIP-712 -- https://eips.ethereum.org/EIPS/eip-712

export interface TypedData {
  types: TypedDataTypes
  primaryType: string
  domain: TypedDataDomain
  message: object
}

export type TypedDataTypes = { [key: string]: TypedDataArgument[] }

export interface TypedDataArgument {
  name: string
  type: string
}

export interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: string
}

export const TypedDataUtils = {
  encodeDigest(typedData: TypedData): Uint8Array {
    const eip191Header = ethers.utils.arrayify('0x1901')

    const domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain)
    
    const messageHash = TypedDataUtils.hashStruct(typedData, typedData.primaryType, typedData.message)

    const pack = ethers.utils.solidityPack(
      ['bytes', 'bytes32', 'bytes32'],
      [eip191Header, ethers.utils.zeroPad(domainHash, 32), ethers.utils.zeroPad(messageHash, 32)]
    )

    const hashPack = ethers.utils.keccak256(pack)
    return ethers.utils.arrayify(hashPack)
  },

  encodeData(typedData: TypedData, primaryType: string, data: object): Uint8Array {
    const args = typedData.types[primaryType]
    if (!args || args.length === 0) {
      throw new Error(`TypedDataUtils: ${typedData.primaryType} type is not unknown`)
    }

    const abiCoder = new ethers.utils.AbiCoder()
    const abiTypes: string[] = []
    const abiValues: any[] = []

    for (let i=0; i < args.length; i++) {
      const arg = args[i]
      const dataValue = data[arg.name]

      if (!dataValue || dataValue === null || dataValue === undefined || dataValue === '') {
        throw new Error(`data value missing for type ${primaryType} with argument name ${arg.name}`)
      }

      if (arg.type === 'bytes' || arg.type === 'string') {
        abiTypes.push('bytes32')

        let v: any
        if (arg.type === 'string') {
          v = ethers.utils.toUtf8Bytes(dataValue)
        } else {
          v = ethers.utils.arrayify(dataValue)
        }

        abiValues.push(
          ethers.utils.arrayify(
            ethers.utils.hexZeroPad(ethers.utils.keccak256(v), 32)
          )
        )
      } else {
        abiTypes.push(arg.type)
        abiValues.push(dataValue)
      }
    }

    if (args.length !== abiTypes.length || abiTypes.length !== abiValues.length) {
      throw new Error('argument coding failed to encode all values')
    }

    return ethers.utils.arrayify(abiCoder.encode(abiTypes, abiValues))
  },

  hashStruct(typedData: TypedData, primaryType: string, data: object): Uint8Array {
    const typeHash = TypedDataUtils.typeHash(typedData.types, primaryType)

    const encodedData = TypedDataUtils.encodeData(typedData, primaryType, data)

    const pack = ethers.utils.solidityPack(
      ['bytes32', 'bytes'],
      [ethers.utils.zeroPad(typeHash, 32), encodedData]
    )

    const hashPack = ethers.utils.keccak256(pack)
    return ethers.utils.arrayify(hashPack)
  },

  typeHash(typedDataTypes: TypedDataTypes, primaryType: string): Uint8Array {
    return ethers.utils.arrayify(
      ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          TypedDataUtils.encodeType(typedDataTypes, primaryType)
        )
      )
    )
  },

  encodeType(typedDataTypes: TypedDataTypes, primaryType: string): string {
    const args = typedDataTypes[primaryType]
    if (!args || args.length === 0) {
      throw new Error(`TypedDataUtils: ${primaryType} type is not defined`)
    }

    const subTypes: string[] = []
    let s = primaryType + '('

    for (let i=0; i < args.length; i++) {
      const arg = args[i]

      if (typedDataTypes[arg.type] && typedDataTypes[arg.type].length > 0) {
        let set = false
        for (let x=0; x < subTypes.length; x++) {
          if (subTypes[x] === arg.type) {
            set = true
          }
        }
        if (!set) {
          subTypes.push(arg.type)
        }
      }
      
      s += arg.type + ' ' + arg.name
      if (i < args.length-1) {
        s += ','
      }
    }
    s += ')'

    subTypes.sort()
    for (let i=0; i < subTypes.length; i++) {
      const subEncodeType = TypedDataUtils.encodeType(typedDataTypes, subTypes[i])
      s += subEncodeType
    }

    return s
  }
}

export const encodeTypedDataDigest = (typedData: TypedData): Uint8Array => {
  return TypedDataUtils.encodeDigest(typedData)
}
