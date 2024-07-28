import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { boolean } from "hardhat/internal/core/params/argumentTypes";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Depoly the Love Token")
  .addParam("hour", "Love Hour")
  .addParam("minute", "Love Minute")
  .addParam("job", "Job ID")
  .addParam("oracle", "Oracle Contract Address")
  .addOptionalParam("verify", "Verify the contract", false, boolean)
  .setAction(async (taskArgs, hre) => {
    const LoveToken = await hre.ethers.getContractFactory("LoveToken");
    const loveToken = await LoveToken.deploy(taskArgs.hour, taskArgs.minute, taskArgs.job, taskArgs.oracle);

    await loveToken.deployed();

    console.log("Love Token deployed to:", loveToken.address);

    if (taskArgs.verify) {
      await hre.run("verify:verify", {
        address: loveToken.address,
        constructorArguments: [
          taskArgs.hour, taskArgs.minute, taskArgs.job, taskArgs.oracle
        ],
      });
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
