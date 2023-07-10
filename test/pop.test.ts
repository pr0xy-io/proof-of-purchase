import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ZERO_ADDRESS } from "./utils/constants";
import { parseEther } from "ethers";
import { expect } from "chai";
import hre from "hardhat";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";

const config = {
  startingPrice: parseEther("0.04"),
  updatedPrice: parseEther("0.02"),
  generateTest: [53, 107, 95],
};

/**
 * @title Proof of Purchase Testing
 * @description Test suite for Proof of Purchase token.
 *
 * @resource https://hardhat.org/tutorial
 */
describe("Proof of Purchase", () => {
  let pop: any;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let receiver: HardhatEthersSigner;
  let vault: HardhatEthersSigner;

  /** @description Prepares the contract and address prior to each test. */
  beforeEach(async () => {
    const signers = await hre.ethers.getSigners();

    owner = signers[0];
    user = signers[1];
    receiver = signers[2];
    vault = signers[3];

    const primary = ZERO_ADDRESS;
    pop = await hre.ethers.deployContract("TokenGated", [
      vault.address,
      primary,
      config.startingPrice,
    ]);
  });

  /** @description Tests related to initial deployment. */
  describe("Deployment", () => {
    it("properly sets the owner", async () => {
      const contractOwner = await pop.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("properly sets the vault", async () => {
      const contractVault = await pop.vault();
      expect(contractVault).to.equal(vault.address);
    });

    it("properly initializes the price", async () => {
      const contractPrice = await pop.price();
      expect(contractPrice).to.equal(config.startingPrice);
    });

    it("properly sets purchasing as active", async () => {
      const oldActive = await pop.active();
      expect(oldActive).to.equal(false);

      await pop.connect(owner).setActive(true);

      const newActive = await pop.active();
      expect(newActive).to.equal(true);
    });
  });

  /** @description Tests related to configuring variables post deployment. */
  describe("Configuring", () => {
    it("changes the price", async () => {
      const oldPrice = await pop.price();
      expect(oldPrice).to.equal(config.startingPrice);

      await pop.connect(owner).setPrice(config.updatedPrice);

      const newPrice = await pop.price();
      expect(newPrice).to.equal(config.updatedPrice);
    });
  });

  /** @description Related to purchasing and/or generating tokens. */
  describe("Purchasing", () => {
    it("throws an error if purchasing is inactive", async () => {
      await expect(
        pop.connect(owner).generate(receiver.address, [1])
      ).to.be.revertedWith("purchasing receipts is not active");
    });

    it("allows the owner to generate a tokens for a user", async () => {
      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(receiver.address, config.generateTest);

      expect(await pop.balanceOf(receiver.address)).to.equal(3);

      config.generateTest.forEach(async (primaryToken, index) => {
        expect(await pop.ownerOf(index)).to.equal(receiver.address);
        expect(await pop.receiptFor(index)).to.equal(primaryToken);
      });
    });
  });

  /** @description Ensuring the tokens are soulbound (untradable). */
  describe("Soulbound", () => {
    it("restricts transfers after mint", async () => {
      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(receiver.address, [1]);

      await expect(
        pop.connect(receiver).transferFrom(receiver.address, user.address, 1)
      ).to.be.revertedWith("token is soulbound");

      await expect(
        pop
          .connect(receiver)
          .safeTransferFrom(receiver.address, user.address, 1)
      ).to.be.revertedWith("token is soulbound");
    });
  });
});
