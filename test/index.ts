import { expect } from "chai";
import { ethers } from "hardhat";

describe("LoveToken", function () {
  it("Deploy Test", async function () {

    const LoveToken = await ethers.getContractFactory("LoveToken");
    const loveToken = await LoveToken.deploy(11, 11);
    await loveToken.deployed();

    // expect(await loveToken.name()).to.equal("The Token of Love");
    // expect(await loveToken.symbol()).to.equal("TOL");


    expect(await loveToken.loveStartRange()).to.equal(40260);
    expect(await loveToken.loveEndRange()).to.equal(40319);
  });
  it("Friendship Test", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const LoveToken = await ethers.getContractFactory("LoveToken");
    const loveToken = await LoveToken.deploy(11, 11);
    await loveToken.deployed();

    expect(await loveToken.hasFriend(owner.address)).to.false;
    await loveToken.weAreFriends(addr1.address);
    expect(await loveToken.hasFriend(owner.address)).to.true;
    expect(await loveToken.friendOf(owner.address)).to.equal(addr1.address);

    await expect(loveToken.weAreFriends(addr2.address)).to.be.revertedWith("Are you non-monogamous?");
  });
  it("Tought of them Test", async function () {
    const [owner] = await ethers.getSigners();
    const addr1 = "0xD41338EE3562617370b54e9b4f58200b0eE0cC45";
    const addr1_priv = "df3032b2d7f31d43cb9e1dd2c996e7634dbec7b7a47a8502f3e953bcc3b62d0a";

    const LoveToken = await ethers.getContractFactory("LoveToken");
    const loveToken = await LoveToken.deploy(11, 11);

    await loveToken.deployed();


    await expect(loveToken.thoughtOfThem()).to.be.revertedWith("You are single my friend");

    await loveToken.weAreFriends(addr1);

    await expect(loveToken.thoughtOfThem()).to.be.revertedWith("You are not on time my friend");

    const currentTimestamp = (await loveToken.getCurrentTimestamp()).toNumber();
    const secondsInDay = currentTimestamp % 86400;
    const hour = Math.floor(secondsInDay / 3600);
    const minute =  Math.floor(((secondsInDay - (hour * 3600))) / 60);

    await loveToken.setLoveHour(hour);
    await loveToken.setLoveMinute(minute);

    const transaction = await loveToken.thoughtOfThem();
    await transaction.wait();

    const receipt = await ethers.provider.getTransactionReceipt(transaction.hash);
    const debugEvents = loveToken.interface.parseLog(receipt.logs[0]);

    expect(debugEvents.name).to.equal("Thought");
    expect(debugEvents.args.lover).to.equal(owner.address);
    expect(debugEvents.args.beloved).to.equal(addr1);

    const wallet = new ethers.Wallet(addr1_priv, ethers.provider);


    const connectedContract = new ethers.Contract(loveToken.address, loveToken.interface, wallet);
    console.log(await connectedContract.loveStartRange());
   });
   it("Cut and Transfer Test", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const LoveToken = await ethers.getContractFactory("LoveToken");
    const loveToken = await LoveToken.deploy(11, 11);

    await loveToken.deployed();

    await loveToken.weAreFriends(addr1.address);

    const currentTimestamp = (await loveToken.getCurrentTimestamp()).toNumber();
    const secondsInDay = currentTimestamp % 86400;
    const hour = Math.floor(secondsInDay / 3600);
    const minute =  Math.floor(((secondsInDay - (hour * 3600))) / 60);

    await loveToken.setLoveHour(hour);
    await loveToken.setLoveMinute(minute);
   });
});
