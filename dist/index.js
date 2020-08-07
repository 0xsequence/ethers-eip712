'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ethers = require('ethers');

var TypedDataUtils = {
    encodeDigest: function (typedData) {
        var eip191Header = ethers.ethers.utils.arrayify('0x1901');
        var domainHash = TypedDataUtils.hashStruct(typedData, 'EIP712Domain', typedData.domain);
        var messageHash = TypedDataUtils.hashStruct(typedData, typedData.primaryType, typedData.message);
        var pack = ethers.ethers.utils.solidityPack(['bytes', 'bytes32', 'bytes32'], [eip191Header, ethers.ethers.utils.zeroPad(domainHash, 32), ethers.ethers.utils.zeroPad(messageHash, 32)]);
        var hashPack = ethers.ethers.utils.keccak256(pack);
        return ethers.ethers.utils.arrayify(hashPack);
    },
    encodeData: function (typedData, primaryType, data) {
        var args = typedData.types[primaryType];
        if (!args || args.length === 0) {
            throw new Error("TypedDataUtils: " + typedData.primaryType + " type is not unknown");
        }
        var abiCoder = new ethers.ethers.utils.AbiCoder();
        var abiTypes = [];
        var abiValues = [];
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            var dataValue = data[arg.name];
            if (!dataValue || dataValue === null || dataValue === undefined || dataValue === '') {
                throw new Error("data value missing for type " + primaryType + " with argument name " + arg.name);
            }
            if (arg.type === 'bytes' || arg.type === 'string') {
                abiTypes.push('bytes32');
                var v = void 0;
                if (arg.type === 'string') {
                    v = ethers.ethers.utils.toUtf8Bytes(dataValue);
                }
                else {
                    v = ethers.ethers.utils.arrayify(dataValue);
                }
                abiValues.push(ethers.ethers.utils.arrayify(ethers.ethers.utils.hexZeroPad(ethers.ethers.utils.keccak256(v), 32)));
            }
            else {
                abiTypes.push(arg.type);
                abiValues.push(dataValue);
            }
        }
        if (args.length !== abiTypes.length || abiTypes.length !== abiValues.length) {
            throw new Error('argument coding failed to encode all values');
        }
        return ethers.ethers.utils.arrayify(abiCoder.encode(abiTypes, abiValues));
    },
    hashStruct: function (typedData, primaryType, data) {
        var typeHash = TypedDataUtils.typeHash(typedData.types, primaryType);
        var encodedData = TypedDataUtils.encodeData(typedData, primaryType, data);
        var pack = ethers.ethers.utils.solidityPack(['bytes32', 'bytes'], [ethers.ethers.utils.zeroPad(typeHash, 32), encodedData]);
        var hashPack = ethers.ethers.utils.keccak256(pack);
        return ethers.ethers.utils.arrayify(hashPack);
    },
    typeHash: function (typedDataTypes, primaryType) {
        return ethers.ethers.utils.arrayify(ethers.ethers.utils.keccak256(ethers.ethers.utils.toUtf8Bytes(TypedDataUtils.encodeType(typedDataTypes, primaryType))));
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
            if (typedDataTypes[arg.type] && typedDataTypes[arg.type].length > 0) {
                var set = false;
                for (var x = 0; x < subTypes.length; x++) {
                    if (subTypes[x] === arg.type) {
                        set = true;
                    }
                }
                if (!set) {
                    subTypes.push(arg.type);
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
    }
};
var encodeTypedDataDigest = function (typedData) {
    return TypedDataUtils.encodeDigest(typedData);
};

exports.TypedDataUtils = TypedDataUtils;
exports.encodeTypedDataDigest = encodeTypedDataDigest;
