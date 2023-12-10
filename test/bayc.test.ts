import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";

/**
 * @title Bored Ape Testing
 * @description Test suite for the Bored Ape Test token.
 *
 * @resource https://hardhat.org/tutorial
 */
describe("Bored Ape Yacht Club [Test]", () => {
  let bayc: any;
  let user: HardhatEthersSigner;
  let owner: HardhatEthersSigner;

  /** @description Prepares the contract and address prior to each test. */
  beforeEach(async () => {
    const signers = await hre.ethers.getSigners();

    owner = signers[0];
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
      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
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

  /** @description Withdrawal functions for extracting the ETH. */
  describe("Withdrawal", () => {
    it("withdraws the ETH to the owner's account", async () => {
      const startingBalance = await hre.ethers.provider.getBalance(owner);
      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
      await bayc.connect(owner).withdraw();
      const endingBalance = await hre.ethers.provider.getBalance(owner);

      const delta = endingBalance - startingBalance;
      const ether = Number(hre.ethers.formatUnits(delta.toString(), "ether"));

      expect(ether).to.be.greaterThan(0.049);
      expect(endingBalance).to.be.greaterThan(startingBalance);
    });
  });
});
