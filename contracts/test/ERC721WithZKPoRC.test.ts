/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Verifier,
  Verifier__factory,
  ERC721WithZKPoRC,
  ERC721WithZKPoRC__factory,
} from "../typechain";
import { ZKPoRCClient, RedeemCodeBuilder } from "@zkporc/circuits";

describe("ERC721WithZKPoRC", function () {
  let verifier: Verifier;
  let erc721WithZKPoRC: ERC721WithZKPoRC;
  let deployer: SignerWithAddress;
  let signer: SignerWithAddress;
  let claimer: SignerWithAddress;
  let client: ZKPoRCClient;
  let builder: RedeemCodeBuilder;
  const name = "ERC721WithZKPoRCTester";
  const symbol = "SYMBOL";
  const version = "1";
  this.beforeEach(async () => {
    [deployer, signer, claimer] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();
    verifier = await new Verifier__factory(deployer).deploy();
    builder = await new RedeemCodeBuilder(
      verifier.address,
      chainId,
      signer
    ).init();
    erc721WithZKPoRC = await new ERC721WithZKPoRC__factory(deployer).deploy(
      name,
      symbol,
      version,
      verifier.address,
      builder.scalarPubKey
    );
    client = await new ZKPoRCClient().init();
  });
  it("Should return the correct verifier address", async function () {
    expect(await erc721WithZKPoRC.verifier()).to.eq(builder.verifier);
  });
  for (let tokenId = 0; tokenId < 3; tokenId += 1) {
    it("Should able to create a zkp and verify them", async function () {
      const msg = builder.getMessageForTokenId(
        erc721WithZKPoRC.address,
        tokenId,
        name,
        version
      );
      const redeemCode = await builder.generateRedeemCode(msg);
      const proof = await client.proveRedeemCode(claimer.address, redeemCode);
      expect(
        await erc721WithZKPoRC.verifyRedeemCode(claimer.address, tokenId, proof)
      ).to.eq(true);
    });
  }
});
