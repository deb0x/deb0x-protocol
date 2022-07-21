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
        userReward = await Deb0x.deploy();
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
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle1 = BigNumber.from("50000000000000000000");
        expect(BigNumber.from(balanceForUser1)).to.equal(expectedValueUser1Cycle1)

        await user2Reward.claimRewards();
        let balanceForUser2 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle1 = BigNumber.from("50000000000000000000");
        expect(BigNumber.from(balanceForUser2)).to.equal(expectedValueUser2Cycle1)
    });

    it(`Claim rewards after multiple cycle with no fees`, async() => {
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueUser1Cycle1 = BigNumber.from("50000000000000000000");
        expect(BigNumber.from(expectedValueUser1Cycle1)).to.equal(balanceForUser1Cycle1)

        await user2Reward.claimRewards();
        let balanceForUser2Cycle1 = await dbxERC20.balanceOf(user2.address);
        let expectedValueUser2Cycle1 = BigNumber.from("50000000000000000000");
        expect(BigNumber.from(expectedValueUser2Cycle1)).to.equal(balanceForUser2Cycle1)

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
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

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check:    
        //let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle3)
        //Reward to distribute in cycle 3: 99.621080262901226266 

        await user1Reward.claimRewards();
        let balanceForUser111 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle3 = BigNumber.from("99621080262901226266").add(BigNumber.from("99905180157700369298"));
        expect(BigNumber.from(balanceForUser111)).to.equal(expectedValueCycle3)
    });


    it(`Claim rewards after multiple cycle with no fees using a single account`, async() => {
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards();
        let balanceForUser1Cycle1 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle1 = BigNumber.from("100000000000000000000");
        expect(BigNumber.from(balanceForUser1Cycle1)).to.equal(expectedValueCycle1)

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check: 
        //let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle2)
        //Reward to distribute in cycle 2: 99.810360315400738596 

        await user1Reward.claimRewards();
        let balanceForUser1Cycle2 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle2 = BigNumber.from("100000000000000000000").add(BigNumber.from("99810360315400738596"));
        expect(BigNumber.from(balanceForUser1Cycle2)).to.equal(expectedValueCycle2)

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //Only for check: 
        //let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        //console.log(rewardToDistributeCycle3)
        //Reward to distribute in cycle 2: 99.621080262901226266

        await user1Reward.claimRewards();
        let balanceForUser1Cycle3 = await dbxERC20.balanceOf(user1.address);
        let expectedValueCycle3 = BigNumber.from("199810360315400738596").add(BigNumber.from("99621080262901226266"));
        expect(BigNumber.from(balanceForUser1Cycle3)).to.equal(expectedValueCycle3)
    });


    it.only(`Claim rewards after multiple cycle with no fees using multiple accounts`, async() => {
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
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

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
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

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
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

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
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
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1800, { value: ethers.utils.parseEther("1") })
        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaim = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaim).to.equal('82.0')
    });

    it(`Single cycle distribution, two messages - 100 DBX reward, USER1 A(F1-18%) => A claimable rewards = 41 DBX 
                                                 USER2 A(F1-10%) => A claimable rewards = 45 DBX`, async() => {

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1800, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaimForUser1 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimForUser1).to.equal('41.0')

        await user2Reward.claimRewards();
        let rewardToClaimForUser2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser2).to.equal('45.0')
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
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaimForUser1 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimForUser1).to.equal('30.0')

        await user2Reward.claimRewards();
        let rewardToClaimForUser2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser2).to.equal('30.0');

        await user3Reward.claimRewards();
        let rewardToClaimForUser3 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser3).to.equal('30.0')

        let rewardToDistributeCycle2 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        console.log("Reward for cycle 2 " + rewardToDistributeCycle2)

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //old balance + actual reward distribution
        await user1Reward.claimRewards()
        let rewardToClaimForUser1Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimForUser1Cycle2).to.equal('59.943108094620221579');

        await user2Reward.claimRewards();
        let rewardToClaimForUser2Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser2Cycle2).to.equal('59.943108094620221579');

        await user3Reward.claimRewards();
        let rewardToClaimForUser3Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser3Cycle2).to.equal('59.943108094620221579');


        let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        console.log("Reward for cycle 3 " + rewardToDistributeCycle3);

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        //old balance + actual reward distribution
        await user1Reward.claimRewards()
        let rewardToClaimForUser1Cycle3 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimForUser1Cycle3).to.equal('89.829432173490589459');

        await user2Reward.claimRewards();
        let rewardToClaimForUser2Cycle3 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser2Cycle3).to.equal('89.829432173490589459');

        await user3Reward.claimRewards();
        let rewardToClaimForUser3Cycle3 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimForUser3Cycle3).to.equal('89.829432173490589459');

    });

    it(`Two cycle distribution, one front with fee another without Cycle 1: 100 DBX  USER1 A(F1-20%) => A claimable rewards = 40 DBX 
                                                                                USER2 A => A claimable rewards = 50 DBX
                                                                        Cycle 2: 99.810360315400738596 DBX  
                                                                        USER1 A(F1-20%) => A claimable rewards = 26.6160... DBX 
                                                                        USER2 A => A claimable rewards = 33.2701... DBX  
                                                                        USER3 A(F1-30%) => A claimable rewards = 23.2890... DBX`, async() => {
        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimRewards()
        let rewardToClaimUser1Cycle1 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimUser1Cycle1).to.equal('40.0')


        await user2Reward.claimRewards()
        let rewardToClaimUser2Cycle1 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimUser2Cycle1).to.equal('50.0')

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 2000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], ethers.constants.AddressZero, 0, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"], feeReceiver.address, 3000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine");

        let rewardToDistributeCycle3 = ethers.utils.formatEther(await userReward.calculateCycleReward());
        console.log("Reward for cycle 2 " + rewardToDistributeCycle3);

        await user1Reward.claimRewards()
        let rewardToClaimUser1Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user1.address));
        expect(rewardToClaimUser1Cycle2).to.equal('66.616096084106863626')


        await user2Reward.claimRewards()
        let rewardToClaimUser2Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user2.address));
        expect(rewardToClaimUser2Cycle2).to.equal('83.270120105133579532')


        await user3Reward.claimRewards()
        let rewardToClaimUser3Cycle2 = ethers.utils.formatEther(await dbxERC20.balanceOf(user3.address));
        expect(rewardToClaimUser3Cycle2).to.equal('23.289084073593505673')
    });

    //Claim fees without staking tokens

    it(`A single cycle, 2 ether gathered as fees should be fully distributed back to users/frontends`, async() => {

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

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
        expect(totalFeesClaimed).to.equal(BigNumber.from("2000000000000000000"))
    });

    it(`Two cycle, 5 ether gathered as fees should be fully distributed back to users/frontends`, async() => {

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

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
        expect(totalFeesClaimedCycle1).to.equal(BigNumber.from("2000000000000000000"))

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

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
        expect(totalFeesClaimedCycle2).to.equal(BigNumber.from("4999999999999999908"))
    });

    it(`Three cycle, 11 ether gathered as fees should be fully distributed back to users/frontends`, async() => {

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await user3Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle1 = BigNumber.from("0")
        for (let entry of feesClaimed) {
            totalFeesClaimedCycle1 = totalFeesClaimedCycle1.add(entry.args.fees)
        }
        expect(totalFeesClaimedCycle1).to.equal(BigNumber.from("4000000000000000000"))

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user3Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

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
        expect(totalFeesClaimedCycle2).to.equal(BigNumber.from("8999999999999999864"))

        await user1Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })
        await user2Reward["send(address[],string[],address,uint256)"]([messageReceiver.address], ["ipfs://"],
            feeReceiver.address, 1000, { value: ethers.utils.parseEther("1") })

        await hre.ethers.provider.send("evm_increaseTime", [60 * 60 * 24])
        await hre.ethers.provider.send("evm_mine")

        await user1Reward.claimFees()
        await user2Reward.claimFees()
        await frontend.claimFrontEndFees();

        let feesClaimed3 = await userReward.queryFilter("FeesClaimed")
        let totalFeesClaimedCycle3 = BigNumber.from("0")
        for (let entry of feesClaimed3) {
            totalFeesClaimedCycle3 = totalFeesClaimedCycle3.add(entry.args.fees)
        }
        expect(totalFeesClaimedCycle3).to.equal(BigNumber.from("10609715468751757410"))
    });
});