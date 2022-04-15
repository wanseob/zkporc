/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Verifier,
  Verifier__factory,
  ZKPoRC,
  ZKPoRC__factory,
} from "../typechain";
import { ZKPoRCClient, RedeemCodeBuilder } from "@zkporc/circuits";

describe("ZKPoRC", function () {
  let verifier: Verifier;
  let zkporc: ZKPoRC;
  let deployer: SignerWithAddress;
  let signer: SignerWithAddress;
  let claimer: SignerWithAddress;
  let client: ZKPoRCClient;
  let builder: RedeemCodeBuilder;
  this.beforeEach(async () => {
    [deployer, signer, claimer] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();
    verifier = await new Verifier__factory(deployer).deploy();
    builder = await new RedeemCodeBuilder(
      verifier.address,
      chainId,
      signer
    ).init();
    zkporc = await new ZKPoRC__factory(deployer).deploy(verifier.address);
    client = await new ZKPoRCClient().init();
  });
  it("Should return the correct verifier address", async function () {
    expect(await zkporc.verifier()).to.eq(builder.verifier);
  });
  it("Should able to create a zkp and verify them", async function () {
    const msg = "0xabcd";
    const redeemCode = await builder.generateRedeemCode(msg);
    const proof = await client.proveRedeemCode(claimer.address, redeemCode);
    expect(
      await zkporc.verify({
        message: msg,
        signer: builder.scalarPubKey,
        claimer: claimer.address,
        proof,
      })
    ).to.eq(true);
  });
});
