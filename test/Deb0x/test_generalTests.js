const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { abi } = require("../../artifacts/contracts/Deb0xERC20.sol/Deb0xERC20.json")

describe("Test DBX tokens distributions", async function() {
    let userReward, user1Reward, user2Reward, user3Reward, frontend, dbxERC20;
    let user1, user2;
    beforeEach("Set enviroment", async() => {
        [user1, user2, user3, messageReceiver, feeReceiver] = await ethers.getSigners();

        const Deb0x = await ethers.getContractFactory("Deb0x");
        userReward = await Deb0x.deploy(ethers.constants.AddressZero);
        await userReward.deployed();

        const dbxAddress = await userReward.dbx()
        dbxERC20 = new ethers.Contract(dbxAddress, abi, hre.ethers.provider)

        user1Reward = userReward.connect(user1)
        user2Reward = userReward.connect(user2)
        user3Reward = userReward.connect(user3)
        frontend = userReward.connect(feeReceiver)
    })

    //Tests without fees
    it(`Claim rewards after one cycle with no fees, happy case`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle1 = BigNumber.from("50000000000000000000");
        expect(expectedValueUser1Cycle1).to.equal(balanceForUser1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle1 = BigNumber.from("50000000000000000000");
        expect(expectedValueUser2Cycle1).to.equal(balanceForUser2)
    });

    it(`Claim rewards after multiple cycle with no fees`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle1 = BigNumber.from("50000000000000000000");
        expect(expectedValueUser1Cycle1).to.equal(balanceForUser1Cycle1)

        await user2Reward.claimRewards();
        let balanceForUser2Cycle1 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle1 = BigNumber.from("50000000000000000000");
        expect(expectedValueUser2Cycle1).to.equal(balanceForUser2Cycle1)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check:    
        //let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle2)
        //Reward to distribute in cycle 2: 99.810360315400738596
        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle2 = BigNumber.from("50000000000000000000").add(BigNumber.from("49905180157700369298"));
        expect(expectedValueUser1Cycle2).to.equal(balanceForUser1Cycle2)

        await user2Reward.claimRewards();
        let balanceForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle2 = BigNumber.from("50000000000000000000").add(BigNumber.from("49905180157700369298"));
        expect(expectedValueUser2Cycle2).to.equal(balanceForUser2Cycle2)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check:    
        //let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle3)
        //Reward to distribute in cycle 3: 99.621080262901226266 

        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle3 = BigNumber.from("99621080262901226266").add(BigNumber.from("99905180157700369298"));
        expect(expectedValueCycle3).to.equal(balanceForUser1Cycle3)
    });

    it(`Claim rewards after multiple cycle with no fees using a single account`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle1 = BigNumber.from("100000000000000000000");
        expect(expectedValueCycle1).to.equal(balanceForUser1Cycle1)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check: 
        //let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle2)
        //Reward to distribute in cycle 2: 99.810360315400738596 

        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle2 = BigNumber.from("100000000000000000000").add(BigNumber.from("99810360315400738596"));
        expect(expectedValueCycle2).to.equal(balanceForUser1Cycle2)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check: 
        //let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle3)
        //Reward to distribute in cycle 2: 99.621080262901226266

        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle3 = BigNumber.from("199810360315400738596").add(BigNumber.from("99621080262901226266"));
        expect(expectedValueCycle3).to.equal(balanceForUser1Cycle3)
    });

    it(`Claim rewards after multiple cycle with no fees using multiple accounts`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        expect(ethers.utils.formatUnits(balanceForUser1Cycle1.toString())).to.equal('33.333333333333333333')

        await user2Reward.claimRewards();
        let balanceForUser2Cycle1 = await dbxERC20.balanceOf(user2.address);
        expect(ethers.utils.formatUnits(balanceForUser2Cycle1.toString())).to.equal('33.333333333333333333')

        await user3Reward.claimRewards();
        let balanceForUser3Cycle1 = await dbxERC20.balanceOf(user3.address);
        expect(ethers.utils.formatUnits(balanceForUser3Cycle1.toString())).to.equal('33.333333333333333333')

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check: 
        //let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle2)
        //Reward to distribute in cycle 2: 99.810360315400738596 

        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle3 = BigNumber.from("33238513491033702631").add(BigNumber.from("50000000000000000000"));
        expect(expectedValueCycle3).to.equal(balanceForUser1Cycle2);

        await user2Reward.claimRewards();
        let balanceForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle2 = BigNumber.from("24952590078850184649").add(BigNumber.from("33333333333333333333"));
        expect(expectedValueUser2Cycle2).to.equal(balanceForUser2Cycle2);

        await user3Reward.claimRewards();
        let balanceForUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        let expectedValueUser3Cycle2 = BigNumber.from("24952590078850184649").add(BigNumber.from("33333333333333333333"));
        expect(expectedValueUser3Cycle2).to.equal(balanceForUser3Cycle2);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let balanceBeforeClaimRewardUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle3 = BigNumber.from("24905270065725306566").add(BigNumber.from(balanceBeforeClaimRewardUser1Cycle3));
        expect(balanceForUser1Cycle3).to.equal(expectedValueUser1Cycle3)

        let balanceBeforeClaimRewardUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        await user2Reward.claimRewards();
        let expectedValueUser2Cycle3 = BigNumber.from(balanceBeforeClaimRewardUser2Cycle3).add(BigNumber.from("49810540131450613133"))
        let balanceForUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        expect(expectedValueUser2Cycle3).to.equal(balanceForUser2Cycle3)

        let balanceBeforeClaimRewardUser3Cycle3 = await dbxERC20.balanceOf(user3.address);
        await user3Reward.claimRewards();
        let expectedValueUser3Cycle3 = BigNumber.from("24905270065725306566").add(BigNumber.from(balanceBeforeClaimRewardUser3Cycle3))
        let balanceForUser3Cycle3 = await dbxERC20.balanceOf(user3.address);
        expect(expectedValueUser3Cycle3).to.equal(balanceForUser3Cycle3)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        let balanceBeforeClaimRewardUser1Cycle4 = await dbxERC20.balanceOf(user1.address);
        await user1Reward.claimRewards();
        let expectedValueUser1Cycle4 = BigNumber.from("24858039790124070831").add(BigNumber.from(balanceBeforeClaimRewardUser1Cycle4))
        let balanceForUser1Cycle4 = await dbxERC20.balanceOf(user1.address);
        expect(balanceForUser1Cycle4).to.equal(expectedValueUser1Cycle4)

        let balanceBeforeClaimRewardUser2Cycle4 = await dbxERC20.balanceOf(user2.address);
        await user2Reward.claimRewards();
        let balanceForUser2Cycle4 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle4 = BigNumber.from("24858039790124070831").add(BigNumber.from(balanceBeforeClaimRewardUser2Cycle4))
        expect(expectedValueUser2Cycle4).to.equal(balanceForUser2Cycle4)

        let balanceBeforeClaimRewardUser3Cycle4 = await dbxERC20.balanceOf(user3.address);
        await user3Reward.claimRewards();
        let balanceForUser3Cycle4 = await dbxERC20.balanceOf(user3.address);
        let expectedValueUser3Cycle4 = BigNumber.from("49716079580248141663").add(BigNumber.from(balanceBeforeClaimRewardUser3Cycle4))
        expect(expectedValueUser3Cycle4).to.equal(balanceForUser3Cycle4)
    });

    //Tests caim rewards with fees for frontend

    it(`Single cycle distribution - 100 DBX reward A(F1-18%) => A claimable rewards = 82 DBX`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1800, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaim = await dbxERC20.balanceOf(user1.address);
        let expectedValue = BigNumber.from("82000000000000000000");
        expect(expectedValue).to.equal(rewardToClaim)
    });

    it(`Single cycle distribution, two messages - 100 DBX reward, USER1 A(F1-18%) => A claimable rewards = 41 DBX 
                                                 USER2 A(F1-10%) => A claimable rewards = 45 DBX`, async() => {

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1800, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaimForUser1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1 = BigNumber.from("41000000000000000000");
        expect(expectedValueUser1).to.equal(rewardToClaimForUser1)

        await user2Reward.claimRewards();
        let rewardToClaimForUser2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2 = BigNumber.from("45000000000000000000");
        expect(expectedValueUser2).to.equal(rewardToClaimForUser2)
    });

    it(`Three-cycle distribution, three messages - Cycle 1: 100 DBX reward, USER1 A(F1-18%) => A claimable rewards = 30 DBX 
                                                               USER2 A(F1-10%) => A claimable rewards = 30 DBX
                                                               USER3 A(F1-10%) => A claimable rewards = 30 DBX
                                                      Cycle 2: 99.810360315400738596, 
                                                      USER1 A(F1 - 10%) =>  A claimable rewards = 29.943108... DBX
                                                      USER2 A(F1 - 10%) =>  A claimable rewards = 29.943108... DBX
                                                      USER3 A(F1 - 10%) =>  A claimable rewards = 29.943108... DBX
                                                      Cycle3: 99.621080262901226266 
                                                      USER1 A(F1 - 10%) =>  A claimable rewards = 29.886324... DBX
                                                      USER2 A(F1 - 10%) =>  A claimable rewards = 29.886324... DBX
                                                      USER3 A(F1 - 10%) =>  A claimable rewards = 29.886324... DBX`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaimForUser1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1 = BigNumber.from("30000000000000000000");
        expect(expectedValueUser1).to.equal(rewardToClaimForUser1)

        await user2Reward.claimRewards();
        let rewardToClaimForUser2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2 = BigNumber.from("30000000000000000000");
        expect(expectedValueUser2).to.equal(rewardToClaimForUser2)

        await user3Reward.claimRewards();
        let rewardToClaimForUser3 = await dbxERC20.balanceOf(user3.address);
        let expectedValueUser3 = BigNumber.from("30000000000000000000");
        expect(expectedValueUser3).to.equal(rewardToClaimForUser3)

        // let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        // console.log("Reward for cycle 2 " + rewardToDistributeCycle2)
        // 99.810360315400738596

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //old balance + actual reward distribution
        let balanceBeforeClaimRewardUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        await user1Reward.claimRewards()
        let rewardToClaimForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle2 = BigNumber.from("29943108094620221579").add(BigNumber.from(balanceBeforeClaimRewardUser1Cycle2))
        expect(expectedValueUser1Cycle2).to.equal(rewardToClaimForUser1Cycle2)

        let balanceBeforeClaimRewardUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        await user2Reward.claimRewards();
        let rewardToClaimForUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle2 = BigNumber.from("29943108094620221579").add(BigNumber.from(balanceBeforeClaimRewardUser2Cycle2))
        expect(expectedValueUser2Cycle2).to.equal(rewardToClaimForUser2Cycle2)

        let balanceBeforeClaimRewardUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        await user3Reward.claimRewards();
        let rewardToClaimForUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        let expectedValueUser3Cycle2 = BigNumber.from("29943108094620221579").add(BigNumber.from(balanceBeforeClaimRewardUser3Cycle2))
        expect(expectedValueUser3Cycle2).to.equal(rewardToClaimForUser3Cycle2)

        // let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        // console.log("Reward for cycle 3 " + rewardToDistributeCycle3);
        // 99.621080262901226266

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //old balance + actual reward distributio        
        let balanceBeforeClaimRewardUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        await user1Reward.claimRewards()
        let expectedValueUser1Cycle3 = BigNumber.from("29886324078870367880").add(BigNumber.from(balanceBeforeClaimRewardUser1Cycle3))
        let rewardToClaimForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        expect(expectedValueUser1Cycle3).to.equal(rewardToClaimForUser1Cycle3);

        let balanceBeforeClaimRewardUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        await user2Reward.claimRewards();
        let expectedValueUser2Cycle3 = BigNumber.from("29886324078870367880").add(BigNumber.from(balanceBeforeClaimRewardUser2Cycle3))
        let rewardToClaimForUser2Cycle3 = await dbxERC20.balanceOf(user2.address);
        expect(expectedValueUser2Cycle3).to.equal(rewardToClaimForUser2Cycle3);

        let balanceBeforeClaimRewardUser3Cycle3 = await dbxERC20.balanceOf(user3.address);
        await user3Reward.claimRewards();
        let expectedValueUser3Cycle3 = BigNumber.from("29886324078870367880").add(BigNumber.from(balanceBeforeClaimRewardUser3Cycle3))
        let rewardToClaimForUser3Cycle3 = await dbxERC20.balanceOf(user3.address);
        expect(expectedValueUser3Cycle3).to.equal(rewardToClaimForUser3Cycle3);

    });

    it(`Two cycle distribution, one front with fee another without Cycle 1: 100 DBX  USER1 A(F1-20%) => A claimable rewards = 40 DBX 
                                                                                USER2 A => A claimable rewards = 50 DBX
                                                                        Cycle 2: 99.810360315400738596 DBX  
                                                                        USER1 A(F1-20%) => A claimable rewards = 26.6160... DBX 
                                                                        USER2 A => A claimable rewards = 33.2701... DBX  
                                                                        USER3 A(F1-30%) => A claimable rewards = 23.2890... DBX`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let expectedValueUser1 = BigNumber.from("40000000000000000000");
        let rewardToClaimUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        expect(expectedValueUser1).to.equal(rewardToClaimUser1Cycle1)

        await user2Reward.claimRewards()
        let expectedValueUser2 = BigNumber.from("50000000000000000000");
        let rewardToClaimUser2Cycle1 = await dbxERC20.balanceOf(user2.address);
        expect(expectedValueUser2).to.equal(rewardToClaimUser2Cycle1)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 3000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine");

        // Only for check
        //let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log("Reward for cycle 2 " + rewardToDistributeCycle3);

        let balanceBeforeClaimRewardUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        await user1Reward.claimRewards()
        let expectedValueUser1Cycle2 = BigNumber.from("26616096084106863626").add(BigNumber.from(balanceBeforeClaimRewardUser1Cycle2))
        let rewardToClaimUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        expect(expectedValueUser1Cycle2).to.equal(rewardToClaimUser1Cycle2);

        let balanceBeforeClaimRewardUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        await user2Reward.claimRewards()
        let expectedValueUser2Cycle2 = BigNumber.from("33270120105133579532").add(BigNumber.from(balanceBeforeClaimRewardUser2Cycle2))
        let rewardToClaimUser2Cycle2 = await dbxERC20.balanceOf(user2.address);
        expect(expectedValueUser2Cycle2).to.equal(rewardToClaimUser2Cycle2)

        await user3Reward.claimRewards()
        let expectedValueUser3Cycle2 = BigNumber.from("23289084073593505673");
        let rewardToClaimUser3Cycle2 = await dbxERC20.balanceOf(user3.address);
        expect(expectedValueUser3Cycle2).to.equal(rewardToClaimUser3Cycle2)
    });

    //Claim fees without staking tokens
    it(`A single cycle, 2 ether gathered as fees should be fully distributed back to users/frontends`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await frontend.claimFrontEndFees();

        const feesClaimed = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for (let entry of feesClaimed) {
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = await userReward.cycleAccruedFees(0)

        let totalFeesClaimedFrontend = BigNumber.from("0")
        const feesClaimedAsFrontend = await frontend.queryFilter("FrontEndFeesClaimed");
        for (let entry of feesClaimedAsFrontend) {
            totalFeesClaimedFrontend = totalFeesClaimedFrontend.add(entry.args.fees)
        }

        const remainder = await hre.ethers.provider.getBalance(userReward.address);
        expect(totalFeesClaimed.add(remainder).add(totalFeesClaimedFrontend)).to.equal(feesCollected);
    });

    it(`Two cycle, 5 ether gathered as fees should be fully distributed back to users/frontends`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle1 = BigNumber.from("0")
        for (let entry of feesClaimed) {
            totalFeesClaimedCycle1 = totalFeesClaimedCycle1.add(entry.args.fees)
        }

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed2 = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle2 = BigNumber.from("0")
        for (let entry of feesClaimed2) {
            totalFeesClaimedCycle2 = totalFeesClaimedCycle2.add(entry.args.fees)
        }
        const feesCollectedBothCycles = (await userReward.cycleAccruedFees(0)).add(await userReward.cycleAccruedFees(1))
        let totalFeesClaimedFrontend = BigNumber.from("0")
        const feesClaimedAsFrontend = await frontend.queryFilter("FrontEndFeesClaimed");
        for (let entry of feesClaimedAsFrontend) {
            totalFeesClaimedFrontend = totalFeesClaimedFrontend.add(entry.args.fees)
        }
        const remainder = await hre.ethers.provider.getBalance(userReward.address);
        expect(totalFeesClaimedCycle2.add(remainder).add(totalFeesClaimedFrontend)).to.equal(feesCollectedBothCycles)
    });

    it(`Three cycle, 11 ether gathered as fees should be fully distributed back to users/frontends`, async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle1 = BigNumber.from("0")
        const feesCollected1 = await user1Reward.cycleAccruedFees(0)
        for (let entry of feesClaimed) {
            totalFeesClaimedCycle1 = totalFeesClaimedCycle1.add(entry.args.fees)
        }
        //expect(totalFeesClaimedCycle1).to.equal(feesCollected1)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed2 = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle2 = BigNumber.from("0")
        const feesCollected2 = (await user1Reward.cycleAccruedFees(0))
            .add(await user1Reward.cycleAccruedFees(1))
        for (let entry of feesClaimed2) {
            totalFeesClaimedCycle2 = totalFeesClaimedCycle2.add(entry.args.fees)
        }
        //expect(totalFeesClaimedCycle2).to.equal(feesCollected2)

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed3 = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle3 = BigNumber.from("0")
        for (let entry of feesClaimed3) {
            totalFeesClaimedCycle3 = totalFeesClaimedCycle3.add(entry.args.fees)
        }
        let totalFeesClaimedFrontend = BigNumber.from("0")
        const feesClaimedAsFrontend = await frontend.queryFilter("FrontEndFeesClaimed");
        for (let entry of feesClaimedAsFrontend) {
            totalFeesClaimedFrontend = totalFeesClaimedFrontend.add(entry.args.fees)
        }

        const feesCollected = (await user1Reward.cycleAccruedFees(0))
            .add(await user1Reward.cycleAccruedFees(1))
            .add(await user1Reward.cycleAccruedFees(2))

        const remainder = await hre.ethers.provider.getBalance(userReward.address);
        expect(totalFeesClaimedCycle3.add(remainder).add(totalFeesClaimedFrontend)).to.equal(feesCollected)
    });

    it("11 ether gathered as fees should be fully distributed back to users and stake, check stake and unstake action", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")


        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward.claimRewards()
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Check reward distribution in cycle 3
        await user3Reward.claimRewards()
        let expectedValueUser3 = BigNumber.from("49810540131450613133");
        let actualBalanceUser3 = await dbxERC20.balanceOf(user3.address);
        expect(expectedValueUser3).to.equal(actualBalanceUser3)

        await user3Reward.unstake(await user3Reward.getUserWithdrawableStake(user3.address))
        let expectedValueUser3ForUnstakeValue = BigNumber.from("50000000000000000000");
        let actualBalanceUser3AfterUnstake = await dbxERC20.balanceOf(user3.address);
        //50 DBX tokens was staed + balance before unstake action
        let excepetedValue = expectedValueUser3ForUnstakeValue.add(BigNumber.from(actualBalanceUser3))
        expect(excepetedValue).to.equal(actualBalanceUser3AfterUnstake)

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        const feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for (let entry of feesClaimed) {
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = (await user1Reward.cycleAccruedFees(0))
            .add(await user1Reward.cycleAccruedFees(1))
            .add(await user1Reward.cycleAccruedFees(2))

        const remainder = await hre.ethers.provider.getBalance(userReward.address);
        expect(totalFeesClaimed.add(remainder)).to.equal(feesCollected)
    });

    it("Stake/Unstake and fronted fees", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward.claimRewards()
        await dbxERC20.connect(user2).approve(user1Reward.address, await dbxERC20.balanceOf(user2.address))
        await user2Reward.stakeDBX(await dbxERC20.balanceOf(user2.address))

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Cycle 2: user3 reward = 26616096084106863626

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Cycle 3: user3 reward =  49810540131450613133
        //Check reward distribution in cycle 3

        await user3Reward.claimRewards()
        let expectedValueUser3 = BigNumber.from("76426636215557476759");
        let actualBalanceUser3 = await dbxERC20.balanceOf(user3.address);
        expect(expectedValueUser3).to.equal(actualBalanceUser3)

        await user2Reward.claimRewards()
        await user2Reward.unstake(await user2Reward.getUserWithdrawableStake(user2.address))
        let actualBalanceUser2AfterUnstake = await dbxERC20.balanceOf(user2.address);
        //50 DBX tokens was staed + balance before unstake action
        let cycle2AndCycle3Value = BigNumber.from("26616096084106863626").add(BigNumber.from("49810540131450613133"))
            //fee frontent 20 in first cycle, two messages send => user1 have 40 DBX and user2 40 DBX
        let excepetedValue = cycle2AndCycle3Value.add(BigNumber.from("40000000000000000000"))
        expect(excepetedValue).to.equal(actualBalanceUser2AfterUnstake)

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();
        const feesClaimed = await user1Reward.queryFilter("FeesClaimed")
        let totalFeesClaimed = BigNumber.from("0")
        for (let entry of feesClaimed) {
            totalFeesClaimed = totalFeesClaimed.add(entry.args.fees)
        }
        const feesCollected = (await user1Reward.cycleAccruedFees(0))
            .add(await user1Reward.cycleAccruedFees(1))
            .add(await user1Reward.cycleAccruedFees(2))

        let totalFeesClaimedFrontend = BigNumber.from("0")
        const feesClaimedAsFrontend = await frontend.queryFilter("FrontEndFeesClaimed");
        for (let entry of feesClaimedAsFrontend) {
            totalFeesClaimedFrontend = totalFeesClaimedFrontend.add(entry.args.fees)
        }
        const remainder = await hre.ethers.provider.getBalance(userReward.address);
        expect(totalFeesClaimed.add(remainder).add(totalFeesClaimedFrontend)).to.equal(feesCollected)
    });

    it("Try claim rewards twice and try claim fees", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let balanceForAlice = await dbxERC20.balanceOf(user1.address);
        let expectedValueAlice = BigNumber.from("100000000000000000000");
        expect(balanceForAlice).to.equal(expectedValueAlice)

        try {
            await user1Reward.claimRewards()
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }

        try {
            await user2Reward.claimFees()
        } catch (error) {
            expect(error.message).to.include('Deb0x: You do not have accrued fees')
        }
    });

    it("Try claim front rewards twice", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await frontend.claimFrontEndRewards();

        let frontBalance = await dbxERC20.balanceOf(feeReceiver.address)
        let expectedValueFront = BigNumber.from("10000000000000000000");
        expect(expectedValueFront).to.equal(frontBalance)

        try {
            await frontend.claimFrontEndRewards();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have rewards");
        }
    });

    it("Try claim front rewards but we have no accrued fees ", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        try {
            await frontend.claimFrontEndFees();
        } catch (error) {
            expect(error.message).to.include("Deb0x: You do not have accrued fees")
        }
    });

    it("Try to send message without gas", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, 0, { value: ethers.utils.parseEther("1") })

        try {
            await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"],
                feeReceiver.address, 1000, 0)
        } catch (error) {
            expect(error.message).to.include("Deb0x: must pay 10% of transaction cost")
        }
    });

    it("Try to stake and unstake", async() => {
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        try {
            await user2Reward.stakeDBX(await userReward.getUserWithdrawableStake(user2.address))
        } catch (error) {
            expect(error.message).to.include("Deb0x: your amount is 0");
        }

        try {
            await user2Reward.unstake(await userReward.getUserWithdrawableStake(user2.address))
        } catch (error) {
            expect(error.message).to.include("Deb0x: your amount is 0");
        }

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward.claimRewards()
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //WithdrawableStake value is in this moment 50 DBX, but we try to unstake 51 DBX
        try {
            await user3Reward.unstake(BigNumber.from("51000000000000000000"))
        } catch (error) {
            expect(error.message).to.include("'Deb0x: can not unstake more than you've staked'")
        }
    });

    it("Multiple stake action and contract balance tests", async() => {
        let balanceBeforeSendMessages = await userReward.contractBalance();
        expect(parseInt(ethers.utils.formatEther(balanceBeforeSendMessages))).to.equal(0);

        await user1Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.getUserWithdrawableStake(user3.address);

        await user2Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.getUserWithdrawableStake(user3.address);
        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.getUserWithdrawableStake(user3.address);
        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        await user3Reward["send(address[],string[],address,uint256,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user3Reward.claimRewards()
        await dbxERC20.connect(user3).approve(userReward.address, await dbxERC20.balanceOf(user3.address))
        await user3Reward.stakeDBX(await dbxERC20.balanceOf(user3.address))

        let expectedValue = await user3Reward.getUserWithdrawableStake(user3.address);
        await user3Reward.unstake(await user3Reward.getUserWithdrawableStake(user3.address))
        let actualBalanceAfterUnstake = await dbxERC20.balanceOf(user3.address);
        expect(expectedValue).to.equal(actualBalanceAfterUnstake)
    });

});