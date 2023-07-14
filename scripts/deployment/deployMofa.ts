import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import hre, { ethers } from "hardhat";
import { globSync } from "glob";
import fs from "fs";
import { parseEther } from "ethers";

/**
 * @title Deploy
 * @description Deploys the related contract to the desired network. The script
 * then saves the deployment information to a json file for later reference or
 * use. Following successful deployment, the script attempts to verify the
 * contract on Etherscan.
 *
 * @resource https://docs.alchemy.com/docs/hello-world-smart-contract
 * @resource https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
 */
const deploy = async () => {
  const network = hre.network.name;

  let available = globSync(`./deployments/deploymentBayc_*_${network}.json`);
  available.sort();

  const recent = available.at(-1);
  const timestampFirst = Number(available.at(0)?.match(/\d+/)?.[0]);
  const timestampRecent = Number(recent?.match(/\d+/)?.[0]);

  if (!recent) throw new Error("No deployment found.");

  if (timestampRecent < timestampFirst)
    throw new Error("Incorrect deployment found.");

  const configBayc = JSON.parse(fs.readFileSync(recent, "utf-8"));

  const [deployer] = await hre.ethers.getSigners();

  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Deploying Made of Ape [Test] to \`${network}\`.`);

  // defining the arguments for made of ape
  const mofaArgs = [
    "Made of Ape",
    "MOFA",
    configBayc.contractAddress,
    `${parseEther("0.04")}`,
    [deployer.address],
    [100],
  ];

  // deploy the made of ape contract
  const mofa = await ethers.deployContract("TokenGated", mofaArgs);
  console.log(`Transaction pending with target address ${mofa.target}.`);
  await mofa.waitForDeployment();

  console.log(`Contract successfully deployed to ${mofa.target}.`);
  const timestamp = Date.now();

  // exporting the information as a json file for reference
  const deployment = JSON.stringify(
    {
      deployer: deployer.address,
      chain: network,
      contractAddress: mofa.target,
      arguments: mofaArgs,
      timestamp,
    },
    null,
    2
  );

  // writing the data to a file to be referenced later on
  fs.writeFileSync(
    `./deployments/deploymentMofa_${timestamp}_${network}.json`,
    deployment,
    "utf-8"
  );

  console.log(`Waiting a minute before verifying the contract...`);
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  // running the verification step
  console.log(`Attempting to verify the contract at ${mofa.target}.`);
  try {
    await hre.run("verify:verify", {
      address: mofa.target,
      constructorArguments: mofaArgs,
    });
  } catch (error) {
    console.error(error);
  }
};

deploy();
