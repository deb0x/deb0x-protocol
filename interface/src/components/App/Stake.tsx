import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import {
    Card, CardActions, CardContent, Button, Grid,
    Typography, TextField, Divider,Box
} from '@mui/material';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import Deb0x from "../../ethereum/deb0x"
import Deb0xERC20 from "../../ethereum/deb0xerc20"
import SnackbarNotification from './Snackbar';
import { ethers } from "ethers";
import "../../componentsStyling/stake.scss";
import token from "../../photos/icons/token.svg"
import coinBagLight from "../../photos/icons/coin-bag-solid--light.svg";
import coinBagDark from "../../photos/icons/coin-bag-solid--dark.svg";
import walletLight from "../../photos/icons/wallet--light.svg";
import walletDark from "../../photos/icons/wallet--dark.svg";
import trophyRewards from "../../photos/icons/trophyRewards.svg";
import { signMetaTxRequest } from '../../ethereum/signer';
import { createInstance } from '../../ethereum/forwarder'

const deb0xAddress = "0x3a05242eCF607ab09c748A75591d9CDda2CdEd81"
const deb0xERC20Address = "0x128aF2cD3F68C508acc29fe6804ffC12cB57D795"

export function Stake(props: any): any {

    const { account, library } = useWeb3React()
    const [notificationState, setNotificationState] = useState({})

    function FeesPanel() {
        const [feesUnclaimed, setFeesUnclaimed] = useState("")
        const [loading, setLoading] = useState(false)

        useEffect(() => {
            feesAccrued()
        }, [feesUnclaimed]);

        async function feesAccrued() {
            const deb0xContract = await Deb0x(library, deb0xAddress)

            const unclaimedRewards = await deb0xContract.getUnclaimedFees(account);

            setFeesUnclaimed(ethers.utils.formatEther(unclaimedRewards))
        }

        async function fetchClaimFeesResult(request: any, url: any) {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data)
                    try{
                        const {tx: txReceipt} = JSON.parse(data.result)
                        if(txReceipt.status == 1){
                            setNotificationState({
                                message: "You succesfully claimed your fees.", open: true,
                                severity: "success"
                            })
                        } else {
                            setNotificationState({
                                message: "Fees couldn't be claimed!", open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    } catch(error) {
                        if(data.status == "pending") {
                            setNotificationState({
                                message: "Your transaction is pending. Your fees should arrive shortly",
                                open: true,
                                severity: "info"
                            })
                        } else if(data.status == "error") {
                            setNotificationState({
                                message: "Transaction relayer error. Please try again",
                                open: true,
                                severity: "error"
                            })
                        }
                    }
                    
                })
        }

        async function claimFees() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)

            const url = "https://api.defender.openzeppelin.com/autotasks/428ba621-5ff5-4425-8f2e-71988912b6c8/runs/webhook/d090d479-22fb-450a-b747-40d46161c437/Qh5dJdtLpBZicAoVRmT98w";
            const forwarder = createInstance(library)
            const from = await signer.getAddress();
            const data = deb0xContract.interface.encodeFunctionData("claimFees()")
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data });
    
                await fetchClaimFeesResult(request, url)
    
            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Fees were not claimed.",
                    open: true,
                    severity: "info"
                })
            }
        }

        return (
            <>
            <Card variant="outlined" className="card-container">
                <CardContent className="row">
                    <div className="col-12 col-md-6 mb-2">
                        <Typography variant="h4" component="div" className="rewards mb-3">
                            FEES
                        </Typography>
                        <Typography >
                            Your unclaimed fees:
                        </Typography>
                        <Typography variant="h6" className="mb-3">
                            <strong>{feesUnclaimed}</strong>
                        </Typography>
                    </div>
                    <div className='col-12 col-md-6 d-flex justify-content-end align-items-start'>
                        <img src={trophyRewards} alt="trophyRewards" className="p-3"/>
                    </div>
                </CardContent>
                <CardActions className='button-container'>
                    <LoadingButton className="collect-btn" disabled={feesUnclaimed=="0.0"} loading={loading} variant="contained" onClick={claimFees}>Collect</LoadingButton>
                </CardActions>
            </Card>
            </>
        )
    }

    function RewardsPanel() {
        

        const [rewardsUnclaimed, setRewardsUnclaimed] = useState("")
        const [feeSharePercentage, setFeeSharePercentage] = useState("")
        const [loading, setLoading] = useState(false)

        useEffect(() => {
            rewardsAccrued()
        }, [rewardsUnclaimed]);

        useEffect(() => {
            feeShare()
        }, [feeSharePercentage]);

        async function rewardsAccrued() {
            const deb0xContract = await Deb0x(library, deb0xAddress)

            const unclaimedRewards = await deb0xContract.getUnclaimedRewards(account);

            setRewardsUnclaimed(ethers.utils.formatEther(unclaimedRewards))
        }

        async function feeShare() {
            const deb0xContract = await Deb0x(library, deb0xAddress)

            const unclaimedRewards = await deb0xContract.getUnclaimedRewards(account);

            const userWithdrawableStake = await deb0xContract.getUserWithdrawableStake(account)
            
            let balance = parseFloat((ethers.utils.formatEther(unclaimedRewards.add(userWithdrawableStake))))
            
            const currentCycle = await deb0xContract.currentStartedCycle()

            const totalSupply = await deb0xContract.summedCycleStakes(currentCycle)

            const feeShare = balance * 100 / totalSupply
            setFeeSharePercentage(((Math.round(feeShare * 100) / 100).toFixed(2)).toString() + "%")
        }

        async function fetchClaimRewardsResult(request: any, url: any) {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data)
                    try{
                        const {tx: txReceipt} = JSON.parse(data.result)
                        if(txReceipt.status == 1){
                            setNotificationState({
                                message: "You succesfully claimed your rewards.", open: true,
                                severity: "success"
                            })
                        } else {
                            setNotificationState({
                                message: "Rewards couldn't be claimed!", open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    } catch(error) {
                        if(data.status == "pending") {
                            setNotificationState({
                                message: "Your transaction is pending. Your rewards should arrive shortly",
                                open: true,
                                severity: "info"
                            })
                        } else if(data.status == "error") {
                            setNotificationState({
                                message: "Transaction relayer error. Please try again",
                                open: true,
                                severity: "error"
                            })
                        }
                    }
                    
                })
        }

        async function claimRewards() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)

            const url = "https://api.defender.openzeppelin.com/autotasks/428ba621-5ff5-4425-8f2e-71988912b6c8/runs/webhook/d090d479-22fb-450a-b747-40d46161c437/Qh5dJdtLpBZicAoVRmT98w";
            const forwarder = createInstance(library)
            const from = await signer.getAddress();
            const data = deb0xContract.interface.encodeFunctionData("claimRewards()")
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data });
    
                await fetchClaimRewardsResult(request, url)
    
            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Rewards were not claimed.",
                    open: true,
                    severity: "info"
                })
            }
        }

        return (
            <>
            <Card variant="outlined" className="card-container">
                <CardContent className="row">
                    <div className="col-12 col-md-6 mb-2">
                        <Typography variant="h4" component="div" className="rewards mb-3">
                            REWARDS
                        </Typography>
                        <Typography >
                            Your unclaimed rewards:
                        </Typography>
                        <Typography variant="h6" className="mb-3">
                            <strong>{rewardsUnclaimed}</strong>
                        </Typography>
                        <Typography>
                            Your share from fees:
                        </Typography>
                        <Typography variant="h6" className="mb-3">
                            <strong>{feeSharePercentage}</strong>
                        </Typography>
                    </div>
                    <div className='col-12 col-md-6 d-flex justify-content-end align-items-start'>
                        <img src={trophyRewards} alt="trophyRewards" className="p-3"/>
                    </div>
                </CardContent>
                <CardActions className='button-container'>
                    <LoadingButton className="collect-btn" loading={loading} variant="contained" onClick={claimRewards}>Collect</LoadingButton>
                </CardActions>
            </Card>
            </>
        )
    }



    function StakeUnstake() {
        const [alignment, setAlignment] = useState("stake");

        const [userStakedAmount, setUserStakedAmount] = useState("")
        const [userUnstakedAmount, setUserUnstakedAmount] = useState("")
        const [totalStaked, setTotalStaked] = useState("")
        const [amountToUnstake, setAmountToUnstake] = useState("")
        const [amountToStake, setAmountToStake] = useState("")
        const [loading, setLoading] = useState(false)
        const [approved, setApproved] = useState<Boolean | null>(false)
        
        const handleChange = (
            event: React.MouseEvent<HTMLElement>,
            newAlignment: string,
        ) => {
            setAlignment(newAlignment);
        };
        
        const [theme, setTheme] = useState(localStorage.getItem('globalTheme'));
        useEffect(() => {
            setTheme(localStorage.getItem('globalTheme'));
        });

        useEffect(() => {
            setStakedAmount()
        }, [userStakedAmount]);

        useEffect(() => {
            totalAmountStaked()
        }, [totalStaked]);

        useEffect(() => {
            setUnstakedAmount()
        }, [userUnstakedAmount]);

        useEffect(() => {
            setApproval()
        }, [approved]);

        async function setStakedAmount() {

            const deb0xContract = await Deb0x(library, deb0xAddress)

            const balance = await deb0xContract.getUserWithdrawableStake(account)

            setUserStakedAmount(ethers.utils.formatEther(balance))
        }

        async function setUnstakedAmount() {
            const deb0xERC20Contract = await Deb0xERC20(library, deb0xERC20Address)

            const balance = await deb0xERC20Contract.balanceOf(account)

            setUserUnstakedAmount(parseFloat(ethers.utils.formatEther(balance)).toFixed(2))
        }

        async function setApproval() {
            const deb0xERC20Contract = await Deb0xERC20(library, deb0xERC20Address)

            const allowance = await deb0xERC20Contract.allowance(account, deb0xAddress)

            allowance > 0 ? setApproved(true) : setApproved(false)
        }

        async function totalAmountStaked() {

            const deb0xContract = await Deb0x(library, deb0xAddress)

            const currentCycle = await deb0xContract.currentStartedCycle()

            const totalSupply = await deb0xContract.summedCycleStakes(currentCycle)

            const pendingStakeWithdrawal = await deb0xContract.pendingStakeWithdrawal()

            setTotalStaked(ethers.utils.formatEther(totalSupply.sub(pendingStakeWithdrawal)))
        }

        async function approveStaking() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xERC20Contract = await Deb0xERC20(signer, deb0xERC20Address)

            try {
                const tx = await deb0xERC20Contract.approve(deb0xAddress, ethers.utils.parseEther("1000000"))

                tx.wait()
                    .then((result: any) => {
                        setNotificationState({
                            message: "Your succesfully approved contract for staking.", open: true,
                            severity: "success"
                        })
                        setLoading(false)

                    })
                    .catch((error: any) => {
                        setNotificationState({
                            message: "Contract couldn't be approved for staking!", open: true,
                            severity: "error"
                        })
                        setLoading(false)
                    })
            } catch (error) {
                setNotificationState({
                    message: "You rejected the transaction. Contract hasn't been approved for staking.", open: true,
                    severity: "info"
                })
                setLoading(false)
            }
        }

        async function fetchUnstakeResult(request: any, url: any) {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data)
                    try{
                        const {tx: txReceipt} = JSON.parse(data.result)
                        if(txReceipt.status == 1){
                            setNotificationState({
                                message: "Your tokens were succesfully unstaked.", open: true,
                                severity: "success"
                            })
                            setLoading(false)
                        } else {
                            setNotificationState({
                                message: "Your tokens couldn't be unstaked!", open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    } catch(error) {
                        if(data.status == "pending") {
                            setNotificationState({
                                message: "Your transaction is pending. Your DBX should be unstaked shortly",
                                open: true,
                                severity: "info"
                            })
                        } else if(data.status == "error") {
                            setNotificationState({
                                message: "Transaction relayer error. Please try again",
                                open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    }
                    
                })
        }

        async function unstake() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)
            const url = "https://api.defender.openzeppelin.com/autotasks/428ba621-5ff5-4425-8f2e-71988912b6c8/runs/webhook/d090d479-22fb-450a-b747-40d46161c437/Qh5dJdtLpBZicAoVRmT98w";
            const forwarder = createInstance(library)
            const from = await signer.getAddress();
            const data = deb0xContract.interface.encodeFunctionData("unstake",
                [ethers.utils.parseEther(amountToUnstake.toString())])
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data });
    
                await fetchUnstakeResult(request, url)
    
            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. DBX were not unstaked.",
                    open: true,
                    severity: "info"
                })
                setLoading(false)
            }
        }

        async function fetchStakeResult(request: any, url: any) {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data)
                    try{
                        const {tx: txReceipt} = JSON.parse(data.result)
                        if(txReceipt.status == 1){
                            setNotificationState({
                                message: "You succesfully staked your DBX.", open: true,
                                severity: "success"
                            })
                        } else {
                            setNotificationState({
                                message: "DBX couldn't be claimed!", open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    } catch(error) {
                        if(data.status == "pending") {
                            setNotificationState({
                                message: "Your transaction is pending. Your DBX should be staked shortly",
                                open: true,
                                severity: "info"
                            })
                        } else if(data.status == "error") {
                            setNotificationState({
                                message: "Transaction relayer error. Please try again",
                                open: true,
                                severity: "error"
                            })
                            setLoading(false)
                        }
                    }
                    
                })
        }

        async function stake() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)
            const url = "https://api.defender.openzeppelin.com/autotasks/428ba621-5ff5-4425-8f2e-71988912b6c8/runs/webhook/d090d479-22fb-450a-b747-40d46161c437/Qh5dJdtLpBZicAoVRmT98w";
            const forwarder = createInstance(library)
            const from = await signer.getAddress();
            const data = deb0xContract.interface.encodeFunctionData("stakeDBX",
                [ethers.utils.parseEther(amountToStake.toString())])
            const to = deb0xContract.address

            try {
                const request = await signMetaTxRequest(library, forwarder, { to, from, data });
    
                await fetchStakeResult(request, url)
    
            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. DBX were not staked.",
                    open: true,
                    severity: "info"
                })
                setLoading(false)
            }
        }

        return (
            <Card variant = "outlined" className="card-container">
                <ToggleButtonGroup
                    color="primary"
                    value={alignment}
                    exclusive
                    onChange={handleChange}
                    className="tab-container"
                >
                    <ToggleButton className="tab-btn" value="stake">Stake</ToggleButton>
                    <ToggleButton className="tab-btn" value="unstake">Unstake</ToggleButton>

                </ToggleButtonGroup>
              
            {
                alignment === "stake" ?
                
                <>
                <CardContent className="row">
                    <div className="col-6 p-1">
                        <img className="display-element" src={theme === "classic" ? coinBagDark : coinBagLight} alt="coinbag" />
                        <Typography className="d-flex justify-content-center p-1">
                            Your staked amount:
                        </Typography>
                        <Typography variant="h6" className="d-flex justify-content-center p-1">
                            <strong>{userStakedAmount} DBX</strong>
                        </Typography>
                    </div>
                    <div className="col-6 p-1">
                        <img className="display-element" src={theme === "classic" ? walletDark : walletLight} alt="coinbag" />
                        <Typography className="d-flex justify-content-center p-1">
                            Your tokens in wallet:
                        </Typography>
                        <Typography variant="h6" className="d-flex justify-content-center p-1">
                            <strong>{userUnstakedAmount} DBX</strong>
                        </Typography>
                    </div>
                    <Divider className="divider-pink " />
                    {approved && <Grid className="amount-row" container spacing={2}>
                        <Grid item>
                            <TextField id="outlined-basic"
                                label="Amount to stake"
                                variant="outlined"
                                type="number"
                                value={amountToStake}
                                onChange={e => setAmountToStake(e.target.value)} />
                        </Grid>
                        <Grid className="max-btn-container" item>
                            <Button className="max-btn" 
                                size="small" variant="contained" color="error" 
                               onClick = {()=>setAmountToStake(userUnstakedAmount)  }>
                                max
                            </Button>
                        </Grid>
                    </Grid>}
                </CardContent>
                <CardActions>
                    {approved && <LoadingButton disabled={!amountToStake} className="submit-btn " loading={loading} variant="contained" onClick={stake}>Stake</LoadingButton>}
                    {!approved && <LoadingButton className="submit-btn" loading={loading} variant="contained" onClick={approveStaking}>Approve Staking</LoadingButton>}
                </CardActions>
                </>
                : 

                <>
                <CardContent>
                    <div className="row">
                        <div className="col-6 p-1">
                            <img className="display-element" src={theme === "classic" ? coinBagDark : coinBagLight} alt="coinbag" />
                            <Typography className="d-flex justify-content-center p-1">
                                Your staked amount:
                            </Typography>
                            <Typography variant="h6" className="d-flex justify-content-center p-1">
                                <strong>{userStakedAmount} DBX</strong>
                            </Typography>
                        </div>
                        <div className="col-6 p-1">
                            <img className="display-element" src={theme === "classic" ? walletDark : walletLight} alt="coinbag" />
                            <Typography className="d-flex justify-content-center p-1">
                                Your tokens in wallet:
                            </Typography>
                            <Typography variant="h6" className="d-flex justify-content-center p-1">
                                <strong>{userUnstakedAmount} DBX</strong>
                            </Typography>
                        </div>
                    </div>
                  

                    <Grid className="amount-row" container spacing={2}>
                        <Grid item>
                            <TextField value={amountToUnstake}
                                id="outlined-basic"
                                className="max-field"
                                label="Amount to unstake"
                                variant="outlined"
                                onChange={e => setAmountToUnstake(e.target.value)}
                                type="number" />
                        </Grid>
                        <Grid className="max-btn-container" item>
                            <Button className="max-btn"
                                size="small" variant="contained" color="error" 
                                onClick = {()=>setAmountToUnstake(userStakedAmount)  }>
                                max
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
                <CardActions>
                    <LoadingButton className="submit-btn" disabled={!amountToUnstake} loading={loading} variant="contained" onClick={unstake}>Unstake</LoadingButton>
                </CardActions>
                </>
            }

            </Card>

        )
    }

    function TotalStaked() {
        const [totalStaked, setTotalStaked] = useState("")
        useEffect(() => {
            totalAmountStaked()
        }, [totalStaked]);
    
        async function totalAmountStaked() {
    
            const deb0xContract = await Deb0x(library, deb0xAddress)

            const currentCycle= await deb0xContract.currentStartedCycle()

            const currentStake = await deb0xContract.summedCycleStakes(currentCycle)

            console.log(currentCycle, ethers.utils.formatEther(currentStake))

            const pendingStakeWithdrawal = await deb0xContract.pendingStakeWithdrawal()

            console.log(ethers.utils.formatEther(pendingStakeWithdrawal))
    
            // setTotalStaked(ethers.utils.formatEther(currentStake))

            setTotalStaked(parseFloat(ethers.utils.formatEther(currentStake.sub(pendingStakeWithdrawal))).toFixed(2))

        }

        return (
            <Card className="heading-card">
                <CardContent>
                    <Typography variant="h5">
                        Total tokens staked:
                    </Typography>
                    <Typography variant="h4">
                        <img className="logo" src={token} />
                        {totalStaked} DBX
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <SnackbarNotification state={notificationState} setNotificationState={setNotificationState} />
            <Box className="container">
                <div className="cards-grid">
                    <div className='row'>
                        <Grid item className="col col-md-6 ">
                            <TotalStaked/>                        
                            <RewardsPanel />
                        </Grid>
                        <Grid item className="col col-md-6">
                            <StakeUnstake/>
                            <FeesPanel />
                        </Grid>
                    </div>
                </div>
            </Box>
        </>
    )
}