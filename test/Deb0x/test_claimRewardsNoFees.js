const { expect } = require("chai");
const { ethers } = require("hardhat");
const { NumUtils } = require("../utils/NumUtils.ts");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json");

describe("Test contract", async function() {
    let rewardedAlice, rewardedBob, rewardedCarol, dbxERC20;
    let alice, bob;
    beforeEach("Set enviroment", async() => {
        [alice, bob, carol, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        rewardedAlice = await Deb0x.deploy();
        await rewardedAlice.deployed();

        const dbxAddress = await rewardedAlice.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        rewardedBob = rewardedAlice.connect(bob)
        rewardedCarol = rewardedAlice.connect(carol)
    });

    it("Should claim no rewards after 2 cycles pass", async() => {

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
        await hre.ethers.provider.send("evm_mine")

        try {
            await rewardedAlice.claimRewards();
            expect.fail("An exception was expected");
        } catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: " +
                "reverted with reason string 'Deb0x: You do not have rewards'");
        }
    });

    it("Should claim no rewards for sending a message in the current cycle", async() => {
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        try {
            await rewardedAlice.claimRewards()
            expect.fail("An exception was expected");
        } catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: " +
                "reverted with reason string 'Deb0x: You do not have rewards'");
        }
    });

    it("Should claim share of rewards after sending a message in the previous day", async() => {
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice.claimRewards();
        const balance = await dbxERC20.balanceOf(alice.address);

        const expected = NumUtils.ether(100).div(3);

        expect(balance).to.equal(expected);
    });

    it("Should be able to claim previous cycle rewards and not reset current messages counter", async() => {
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await rewardedAlice.claimRewards()
        expect(await dbxERC20.balanceOf(alice.address)).to.equal(NumUtils.day1());

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice.claimRewards()

        const day1 = NumUtils.day1();
        const day2 = NumUtils.day2();
        const expected = day1.add(day2);

        expect(await dbxERC20.balanceOf(alice.address)).to.equal(expected);
    });

    it("Should be able to claim previous 2 cycles rewards", async() => {
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice.claimRewards()

        const day1 = NumUtils.day1();
        const day2 = NumUtils.day2();
        const expected = day1.add(day2);

        expect(await dbxERC20.balanceOf(alice.address)).to.equal(expected);
    });

    it("Should claim share of rewards after sending a message in the previous day", async() => {

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedBob["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 2])
        await hre.ethers.provider.send("evm_mine")

        await rewardedCarol["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice.claimRewards()
        await rewardedBob.claimRewards()
        await rewardedCarol.claimRewards()

        // Alice  gets entire day2 reward and 2/3 of day3   
        const aliceExpected = NumUtils.day(2).add(
            NumUtils.day(3).mul(2).div(3)
        );
        expect(await dbxERC20.balanceOf(alice.address)).to.equal(aliceExpected);

        // Bob    gets entire 1/3 of day3
        const bobExpected = NumUtils.day(3).div(3);
        expect(await dbxERC20.balanceOf(bob.address)).to.equal(bobExpected);

        // Carol  gets entire day4 reward
        const carolExpected = NumUtils.day(4);
        expect(await dbxERC20.balanceOf(carol.address)).to.equal(carolExpected);
    });

    it("On day 6, Should claim day 2 rewards after sending one message in day 1 and one message in day 5", async() => {

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 4])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await rewardedAlice.claimRewards()

        // Alice  gets day1 and day2 rewards   
        const aliceExpected = NumUtils.day1().add(NumUtils.day2());
        expect(await dbxERC20.balanceOf(alice.address)).to.equal(aliceExpected);
    });
});