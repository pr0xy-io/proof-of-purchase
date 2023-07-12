import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { parseEther } from "ethers";
import { expect } from "chai";
import hre from "hardhat";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";

const config = {
  startingPrice: parseEther("0.04"),
  updatedPrice: parseEther("0.02"),
  generateTest: [6, 9, 1],
};

/**
 * @title Proof of Purchase Testing
 * @description Test suite for Proof of Purchase token.
 *
 * @resource https://hardhat.org/tutorial
 *
 * todo: beforeAll instead of beforeEach (https://stackoverflow.com/questions/37912397)
 */
describe("Proof of Purchase", () => {
  let pop: any;
  let bayc: any;
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

    // deploys a bored ape contract to test interactions with it
    bayc = await hre.ethers.deployContract("BoredApeYachtClub", [
      "Bored Ape Yacht Club",
      "BAYC",
      10000,
      1619060596,
    ]);

    pop = await hre.ethers.deployContract("TokenGated", [
      bayc.target,
      config.startingPrice,
      [vault.address],
      [100],
    ]);

    // ensuring the sale is active for testing
    await bayc.connect(owner).flipSaleState();
    const state = await bayc.saleIsActive();
    expect(state).to.equal(true);
  });

  /** @description Running some basic BAYC functions. */
  describe("Bored Ape Yacht Club", () => {
    it("allows someone to purchase a BAYC", async () => {
      await bayc.connect(user).mintApe(5, { value: parseEther("0.40") });
      expect(await bayc.balanceOf(user.address)).to.equal(5);
    });
  });

  /** @description Tests related to initial deployment. */
  describe("Deployment", () => {
    it("properly sets the owner", async () => {
      const contractOwner = await pop.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    // todo: implement this for the payment splitter
    // it("properly sets the vault", async () => {
    //   const contractVault = await pop.vault();
    //   expect(contractVault).to.equal(vault.address);
    // });

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

    it("allows the owner to generate tokens for a user", async () => {
      // allocating 10 board apes to the users wallet
      await bayc.connect(user).mintApe(10, { value: parseEther("0.80") });
      expect(await bayc.balanceOf(user.address)).to.equal(10);

      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(user.address, config.generateTest);

      expect(await pop.balanceOf(user.address)).to.equal(3);

      config.generateTest.forEach(async (primaryToken, index) => {
        expect(await pop.ownerOf(index)).to.equal(receiver.address);
        expect(await pop.receiptFor(index)).to.equal(primaryToken);
      });
    });
  });

  /** @description Ensuring the tokens are soulbound (untradable). */
  describe("Soulbound", () => {
    it("restricts transfers after mint", async () => {
      // allocating 1 board ape to the users wallet
      await bayc.connect(user).mintApe(1, { value: parseEther("0.08") });
      expect(await bayc.balanceOf(user.address)).to.equal(1);

      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(user.address, [0]);

      expect(await pop.balanceOf(user.address)).to.equal(1);

      await expect(
        pop.connect(user).transferFrom(user.address, receiver.address, 1)
      ).to.be.revertedWith("token is soulbound");

      await expect(
        pop.connect(user).safeTransferFrom(user.address, receiver.address, 1)
      ).to.be.revertedWith("token is soulbound");

      await expect(
        pop
          .connect(user)
          ["safeTransferFrom(address,address,uint256,bytes)"](
            user.address,
            receiver.address,
            1,
            "0x01"
          )
      ).to.be.revertedWith("token is soulbound");
    });
  });
});
