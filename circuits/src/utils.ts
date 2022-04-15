import { BigNumber, BigNumberish } from "ethers";
import {
  BytesLike,
  solidityKeccak256,
  _TypedDataEncoder,
} from "ethers/lib/utils";

export const toTypedDataHash = (
  domainSeparator: BytesLike,
  structHash: BytesLike
) => {
  return solidityKeccak256(
    ["string", "bytes32", "bytes32"],
    ["\x19\x01", domainSeparator, structHash]
  );
};

export const hashTypedDataV4 = (
  domainSeparator: BytesLike,
  structHash: BytesLike
) => {
  return toTypedDataHash(domainSeparator, structHash);
};

export const getMessage = (
  chainId: number,
  address: string,
  name: string,
  version: string,
  tokenId: BigNumberish
) => {
  const typeHash = solidityKeccak256(
    ["string"],
    ["MintWithZKPoRC(uint256 tokenId)"]
  );
  const structHash = solidityKeccak256(
    ["bytes32", "uint256"],
    [typeHash, tokenId]
  );
  const domain = {
    name,
    version,
    chainId,
    verifyingContract: address,
  };
  const digest = hashTypedDataV4(
    _TypedDataEncoder.hashDomain(domain),
    structHash
  );
  const msg = BigNumber.from(digest).mod(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
  );
  return msg;
};
