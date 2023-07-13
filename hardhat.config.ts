import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import getEnv from "./utils/getEnv";
import dotenv from "dotenv";
import "solidity-coverage";

dotenv.config({
  path: `${__dirname}/${getEnv(process.env.NODE_ENV)}`,
});

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 10_000,
  },
};

if (process.env.NODE_ENV === "deploy") {
  config.defaultNetwork = "hardhat";
  config.etherscan = {
    apiKey: process.env.ETHERSCAN_API_KEY,
  };
  config.networks = {
    hardhat: {},
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
export default config;
