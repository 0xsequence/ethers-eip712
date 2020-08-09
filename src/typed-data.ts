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
  salt?: string
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
    const types = typedData.types
    const args = types[primaryType]
    if (!args || args.length === 0) {
      throw new Error(`TypedDataUtils: ${typedData.primaryType} type is not unknown`)
    }

    const abiCoder = new ethers.utils.AbiCoder()
    const abiTypes: string[] = []
    const abiValues: any[] = []

    const typeHash = TypedDataUtils.typeHash(typedData.types, primaryType)
    abiTypes.push('bytes32')
    abiValues.push(ethers.utils.zeroPad(typeHash, 32))

    const encodeField = (name: string, type: string, value: any): (string | Uint8Array)[] => {
      if (types[type] !== undefined) {
        return ['bytes32', ethers.utils.arrayify(
          ethers.utils.keccak256(TypedDataUtils.encodeData(typedData, type, value))
        )]
      }

      if (type === 'bytes' || type === 'string') {
        let v: any
        if (type === 'string') {
          v = ethers.utils.toUtf8Bytes(value)
        } else {
          v = ethers.utils.arrayify(value)
        }
        return ['bytes32', ethers.utils.arrayify(
          ethers.utils.hexZeroPad(ethers.utils.keccak256(v), 32)
        )]

      } else if (type.lastIndexOf('[') > 0) {
        const t = type.slice(0, type.lastIndexOf('['))
        const v = value.map((item) => encodeField(name, t, item))
        return ['bytes32', ethers.utils.arrayify(
            ethers.utils.keccak256(
              ethers.utils.arrayify(
                abiCoder.encode(
                  v.map(([tt]) => tt),
                  v.map(([, vv]) => vv)
                )
              )
            )
          )
        ]

      } else {
        return [type, value]
      }
    }

    for (const field of args) {
      const [type, value] = encodeField(field.name, field.type, data[field.name]);
      abiTypes.push(type as string)
      abiValues.push(value)
    }

    return ethers.utils.arrayify(abiCoder.encode(abiTypes, abiValues))
  },

  hashStruct(typedData: TypedData, primaryType: string, data: object): Uint8Array {
    return ethers.utils.arrayify(
      ethers.utils.keccak256(
        TypedDataUtils.encodeData(typedData, primaryType, data)
      )
    )
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
      const arrayArg = arg.type.indexOf('[')
      const argType = arrayArg < 0 ? arg.type : arg.type.slice(0, arrayArg)

      if (typedDataTypes[argType] && typedDataTypes[argType].length > 0) {
        let set = false
        for (let x=0; x < subTypes.length; x++) {
          if (subTypes[x] === argType) {
            set = true
          }
        }
        if (!set) {
          subTypes.push(argType)
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
  },

  domainType(domain: TypedDataDomain): TypedDataArgument[] {
    const type: TypedDataArgument[] = []
    if (domain.name) {
      type.push({ name: 'name', type: 'string' })
    }
    if (domain.version) {
      type.push({ name: 'version', type: 'string' })
    }
    if (domain.chainId) {
      type.push({ name: 'chainId', type: 'uint256' })
    }
    if (domain.verifyingContract) {
      type.push({ name: 'verifyingContract', type: 'address' })
    }
    if (domain.salt) {
      type.push({ name: 'salt', type: 'bytes32' })
    }
    return type
  }

  // buildTypedData(): TypedData {
  //   return {}
  // }
}

export const encodeTypedDataDigest = (typedData: TypedData): Uint8Array => {
  return TypedDataUtils.encodeDigest(typedData)
}

// export const buildTypedData = (): TypedData => {
//   return TypedDataUtils.buildTypedData()
// }

export const domainType = (domain: TypedDataDomain): TypedDataArgument[] => {
  return TypedDataUtils.domainType(domain)
}
