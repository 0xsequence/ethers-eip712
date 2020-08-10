import { ethers } from 'ethers';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var TypedDataUtils = {
    encodeDigest: function (typedData) {
        var eip191Header = ethers.utils.arrayify('0x1901');
        var domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain);
        var messageHash = TypedDataUtils.hashStruct(typedData, typedData.primaryType, typedData.message);
        var pack = ethers.utils.solidityPack(['bytes', 'bytes32', 'bytes32'], [eip191Header, ethers.utils.zeroPad(domainHash, 32), ethers.utils.zeroPad(messageHash, 32)]);
        var hashPack = ethers.utils.keccak256(pack);
        return ethers.utils.arrayify(hashPack);
    },
    encodeData: function (typedData, primaryType, data) {
        var types = typedData.types;
        var args = types[primaryType];
        if (!args || args.length === 0) {
            throw new Error("TypedDataUtils: " + typedData.primaryType + " type is not unknown");
        }
        var abiCoder = new ethers.utils.AbiCoder();
        var abiTypes = [];
        var abiValues = [];
        var typeHash = TypedDataUtils.typeHash(typedData.types, primaryType);
        abiTypes.push('bytes32');
        abiValues.push(ethers.utils.zeroPad(typeHash, 32));
        var encodeField = function (name, type, value) {
            if (types[type] !== undefined) {
                return ['bytes32', ethers.utils.arrayify(ethers.utils.keccak256(TypedDataUtils.encodeData(typedData, type, value)))];
            }
            if (type === 'bytes' || type === 'string') {
                var v = void 0;
                if (type === 'string') {
                    v = ethers.utils.toUtf8Bytes(value);
                }
                else {
                    v = ethers.utils.arrayify(value);
                }
                return ['bytes32', ethers.utils.arrayify(ethers.utils.hexZeroPad(ethers.utils.keccak256(v), 32))];
            }
            else if (type.lastIndexOf('[') > 0) {
                var t_1 = type.slice(0, type.lastIndexOf('['));
                var v = value.map(function (item) { return encodeField(name, t_1, item); });
                return ['bytes32', ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(abiCoder.encode(v.map(function (_a) {
                        var tt = _a[0];
                        return tt;
                    }), v.map(function (_a) {
                        var vv = _a[1];
                        return vv;
                    })))))
                ];
            }
            else {
                return [type, value];
            }
        };
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var field = args_1[_i];
            var _a = encodeField(field.name, field.type, data[field.name]), type = _a[0], value = _a[1];
            abiTypes.push(type);
            abiValues.push(value);
        }
        return ethers.utils.arrayify(abiCoder.encode(abiTypes, abiValues));
    },
    hashStruct: function (typedData, primaryType, data) {
        return ethers.utils.arrayify(ethers.utils.keccak256(TypedDataUtils.encodeData(typedData, primaryType, data)));
    },
    typeHash: function (typedDataTypes, primaryType) {
        return ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(TypedDataUtils.encodeType(typedDataTypes, primaryType))));
    },
    encodeType: function (typedDataTypes, primaryType) {
        var args = typedDataTypes[primaryType];
        if (!args || args.length === 0) {
            throw new Error("TypedDataUtils: " + primaryType + " type is not defined");
        }
        var subTypes = [];
        var s = primaryType + '(';
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            var arrayArg = arg.type.indexOf('[');
            var argType = arrayArg < 0 ? arg.type : arg.type.slice(0, arrayArg);
            if (typedDataTypes[argType] && typedDataTypes[argType].length > 0) {
                var set = false;
                for (var x = 0; x < subTypes.length; x++) {
                    if (subTypes[x] === argType) {
                        set = true;
                    }
                }
                if (!set) {
                    subTypes.push(argType);
                }
            }
            s += arg.type + ' ' + arg.name;
            if (i < args.length - 1) {
                s += ',';
            }
        }
        s += ')';
        subTypes.sort();
        for (var i = 0; i < subTypes.length; i++) {
            var subEncodeType = TypedDataUtils.encodeType(typedDataTypes, subTypes[i]);
            s += subEncodeType;
        }
        return s;
    },
    domainType: function (domain) {
        var type = [];
        if (domain.name) {
            type.push({ name: 'name', type: 'string' });
        }
        if (domain.version) {
            type.push({ name: 'version', type: 'string' });
        }
        if (domain.chainId) {
            type.push({ name: 'chainId', type: 'uint256' });
        }
        if (domain.verifyingContract) {
            type.push({ name: 'verifyingContract', type: 'address' });
        }
        if (domain.salt) {
            type.push({ name: 'salt', type: 'bytes32' });
        }
        return type;
    },
    buildTypedData: function (domain, messageTypes, primaryType, message) {
        var domainType = TypedDataUtils.domainType(domain);
        var typedData = {
            domain: domain,
            types: __assign({ 'EIP712Domain': domainType }, messageTypes),
            primaryType: primaryType,
            message: message
        };
        return typedData;
    }
};
var encodeTypedDataDigest = function (typedData) {
    return TypedDataUtils.encodeDigest(typedData);
};
var buildTypedData = function (domain, messageTypes, primaryType, message) {
    return TypedDataUtils.buildTypedData(domain, messageTypes, primaryType, message);
};
var domainType = function (domain) {
    return TypedDataUtils.domainType(domain);
};

export { TypedDataUtils, buildTypedData, domainType, encodeTypedDataDigest };
