import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";

const config = {
  startingPrice: ethers.parseEther("0.04"),
  updatedPrice: ethers.parseEther("0.02"),
  generateTest: [2, 4, 1],
};

/**
 * @title Proof of Purchase Testing
 * @description Test suite for Proof of Purchase token.
 *
 * @resource https://hardhat.org/tutorial
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
    bayc = await hre.ethers.deployContract("BoredApeTest", [
      "Bored Ape Test",
      "BAT",
      "https://cdn.pr0xy.io/mofa/boredapetest.json",
    ]);

    pop = await hre.ethers.deployContract("TokenGated", [
      "ProofOfPurchase",
      "POP",
      bayc.target,
      config.startingPrice,
      [vault.address],
      [100],
    ]);
  });

  /** @description Tests related to initial deployment. */
  describe("Deployment", () => {
    it("properly sets the owner", async () => {
      const contractOwner = await pop.owner();
      expect(contractOwner).to.equal(owner.address);
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

    it("allows the owner to generate tokens for a user", async () => {
      // allocating 5 board apes to the users wallet
      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
      expect(await bayc.balanceOf(user.address)).to.equal(5);

      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(user.address, config.generateTest);

      expect(await pop.balanceOf(user.address)).to.equal(3);

      config.generateTest.forEach(async (primaryToken, index) => {
        expect(await pop.ownerOf(index)).to.equal(receiver.address);
        expect(await pop.receiptFor(index)).to.equal(primaryToken);
      });
    });

    it("allows a user to purchase tokens", async () => {
      // the user first purchases bored ape tokens
      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
      expect(await bayc.balanceOf(user.address)).to.equal(5);

      // the owner then activates the sale of the mofa tokens
      await pop.connect(owner).setActive(true);

      // then the user can purchase the mofa tokens
      await pop
        .connect(user)
        .purchase(config.generateTest, { value: ethers.parseEther("0.12") });
      expect(await pop.balanceOf(user.address)).to.equal(3);
    });
  });

  /** @description Ensuring the tokens are soulbound (untradable). */
  describe("Soulbound", () => {
    it("restricts transfers after mint", async () => {
      // allocating 1 board ape to the users wallet
      await bayc.connect(user).mintApe(1, { value: ethers.parseEther("0.01") });
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

  /** @description Properly sets the URI. */
  describe("URI", () => {
    it("sets the URI", async () => {
      // allocating 5 board apes to the users wallet
      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
      expect(await bayc.balanceOf(user.address)).to.equal(5);

      await pop.connect(owner).setActive(true);

      await pop.connect(owner).generate(user.address, config.generateTest);

      await pop.setBaseURI("https://cdn.pr0xy.io/mofa/");

      const uri = await pop.tokenURI(1);

      expect(uri).to.equal("https://cdn.pr0xy.io/mofa/1");
    });
  });

  /** @description Ensuring withdrawals are performed correctly. */
  describe("Withdrawals", () => {
    it("correctly withdraws to the vault", async () => {
      const startingBalance = await hre.ethers.provider.getBalance(vault);

      await bayc.connect(user).mintApe(5, { value: ethers.parseEther("0.05") });
      await pop.connect(owner).setActive(true);
      await pop
        .connect(user)
        .purchase(config.generateTest, { value: ethers.parseEther("0.12") });
      await pop.connect(owner).releaseTotal();

      const endingBalance = await hre.ethers.provider.getBalance(vault);

      expect(endingBalance).to.be.gt(startingBalance);
    });
  });
});
