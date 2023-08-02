import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import hre from "hardhat";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import { parseEther } from "ethers";

/**
 * @title Bored Ape Testing
 * @description Test suite for the Bored Ape Test token.
 *
 * @resource https://hardhat.org/tutorial
 */
describe("Bored Ape Yacht Club [Test]", () => {
  let bayc: any;
  let user: HardhatEthersSigner;

  /** @description Prepares the contract and address prior to each test. */
  beforeEach(async () => {
    const signers = await hre.ethers.getSigners();

    user = signers[1];

    // deploys a bored ape contract to test interactions with it
    bayc = await hre.ethers.deployContract("BoredApeTest", [
      "Bored Ape Test",
      "BAT",
      "https://cdn.pr0xy.io/mofa/boredapetest.json",
    ]);
  });

  /** @description Running some basic BAYC functions. */
  describe("Purchasing", () => {
    it("allows someone to purchase a BAYC", async () => {
      await bayc.connect(user).mintApe(5, { value: parseEther("0.05") });
      expect(await bayc.balanceOf(user.address)).to.equal(5);
    });
  });

  /** @description Tests related to initial deployment. */
  describe("Deployment", () => {
    it("properly sets the static URI", async () => {
      const uri = await bayc.tokenURI(0);
      expect(uri).to.equal("https://cdn.pr0xy.io/mofa/boredapetest.json");
    });
  });
});
