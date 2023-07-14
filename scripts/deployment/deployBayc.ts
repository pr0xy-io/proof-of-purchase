import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import hre, { ethers } from "hardhat";
import fs from "fs";

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
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Deploying Bored Ape Yacht Club [Test] to \`${network}\`.`);

  // defining the arguments for bored apes
  const boredApeArgs = ["Bored Ape Yacht Club", "BAYC", 10000, 1619060596];

  // deploy the bored ape yacht club contract
  const bayc = await ethers.deployContract("BoredApeYachtClub", boredApeArgs);
  console.log(`Transaction pending with target address ${bayc.target}.`);
  await bayc.waitForDeployment();

  console.log(`Contract successfully deployed to ${bayc.target}.`);
  const timestamp = Date.now();

  // exporting the information as a json file for use with the POP contract
  const deployment = JSON.stringify(
    {
      deployer: deployer.address,
      chain: network,
      contractAddress: bayc.target,
      arguments: boredApeArgs,
      timestamp,
    },
    null,
    2
  );

  // writing the data to a file to be referenced by the POP contract
  fs.writeFileSync(
    `./deployments/deploymentBayc_${timestamp}_${network}.json`,
    deployment,
    "utf-8"
  );

  console.log(`Waiting a minute before verifying the contract...`);
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  // running the verification step
  console.log(`Attempting to verify the contract at ${bayc.target}.`);
  try {
    await hre.run("verify:verify", {
      address: bayc.target,
      constructorArguments: boredApeArgs,
    });
  } catch (error) {
    console.error(error);
  }
};

deploy();
