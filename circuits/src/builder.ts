import { buildEddsa, buildBabyjub } from "circomlibjs";
import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { arrayify, hexlify, hexZeroPad } from "ethers/lib/utils";
import { BigNumber, BigNumberish } from "ethers";
import { getMessage } from "./utils";

export class RedeemCodeBuilder {
  private _signer: TypedDataSigner;
  private _eddsa: any;
  private _babyjub: any;
  private _verifier: string;
  private _chainId: number;
  private _prvKey?: Uint8Array;
  private _pubKey?: [Uint8Array, Uint8Array];

  get verifier() {
    return this._verifier;
  }

  get initialized() {
    return (
      this._eddsa !== undefined &&
      this._babyjub !== undefined &&
      this._prvKey !== undefined &&
      this._pubKey !== undefined
    );
  }

  get pubKey(): [Uint8Array, Uint8Array] {
    if (!this._pubKey) throw Error("Not initialized");
    return this._pubKey;
  }

  get scalarPubKey(): [bigint, bigint] {
    if (!this._pubKey) throw Error("Not initialized");
    return [
      this._babyjub.F.toObject(this._pubKey[0]),
      this._babyjub.F.toObject(this._pubKey[1]),
    ];
  }

  constructor(contract: string, chainId: number, signer: TypedDataSigner) {
    this._signer = signer;
    this._verifier = contract;
    this._chainId = chainId;
  }

  async init() {
    if (this.initialized) return this;
    // const zkporc.DOMAIN
    const types = {
      EdDSAKey: [
        { name: "name", type: "string" },
        { name: "contract", type: "address" },
      ],
    };
    const values = {
      name: "ZKPoRC",
      contract: this.verifier,
    };
    this._eddsa = await buildEddsa();
    this._babyjub = await buildBabyjub();
    const eddsaPrivKey = await this._signer._signTypedData(
      {
        name: "ZKPoRC",
        version: "1",
        chainId: this._chainId,
        verifyingContract: this._verifier,
      },
      types,
      values
    );
    this._prvKey = arrayify(eddsaPrivKey);
    this._pubKey = await this._eddsa.prv2pub(this._prvKey);
    return this;
  }

  async sign(message: BigNumberish) {
    const m = this._babyjub.F.e(BigNumber.from(message).toString());
    const signature = this._eddsa.signPoseidon(this._prvKey, m);
    if (!this._eddsa.verifyPoseidon(m, signature, this._pubKey))
      throw Error("generated invalid eddsa signature");
    return signature;
  }

  async generateRedeemCode(message: BigNumberish) {
    const msgToSign = hexZeroPad(hexlify(message), 32);
    const signature = await this.sign(msgToSign);
    const data = {
      msg: msgToSign.toString(),
      pubKey: {
        X: this.scalarPubKey[0].toString(),
        Y: this.scalarPubKey[1].toString(),
      },
      sig: {
        S: signature.S.toString(),
        R8: {
          X: this._babyjub.F.toObject(signature.R8[0]).toString(),
          Y: this._babyjub.F.toObject(signature.R8[1]).toString(),
        },
      },
    };
    return JSON.stringify(data);
  }

  getMessageForTokenId(
    contract: string,
    tokenId: BigNumberish,
    contractName: string,
    contractVersion: string
  ) {
    return getMessage(
      this._chainId,
      contract,
      contractName,
      contractVersion,
      tokenId
    );
  }
}
