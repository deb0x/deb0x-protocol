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

const deb0xAddress = "0x13dA6EDcdD7F488AF56D0804dFF54Eb17f41Cc61"
const deb0xERC20Address = "0xEde2f177d6Ae8330860B6b37B2F3D767cd2630fe"

export function Stake(props: any): any {
    const { account, library } = useWeb3React()
    const [notificationState, setNotificationState] = useState({})

    useEffect(() => {
        console.log("stake component effect")
    });
    
    function RewardsPanel() {

        const [rewardsUnclaimed, setRewardsUnclaimed] = useState("")
        const [feeSharePercentage, setFeeSharePercentage] = useState("")
        const [loading, setLoading] = useState(false)

        useEffect(() => {
            console.log("rewards effect")
            rewardsAccrued()
        }, [rewardsUnclaimed]);

        useEffect(() => {
            console.log("fee share effect")
            feeShare()
        }, [feeSharePercentage]);

        async function rewardsAccrued() {
            const deb0xContract = await Deb0x(library, deb0xAddress)

            const unclaimedRewards = await deb0xContract.earnedNative(account);

            setRewardsUnclaimed(ethers.utils.formatEther(unclaimedRewards))
        }

        async function feeShare() {
            console.log("aicii")
            const deb0xContract = await Deb0x(library, deb0xAddress)
            console.log("1")
            
            let balance = parseFloat((ethers.utils.formatEther((await deb0xContract.balanceERC20(account)) )) )
            console.log(balance + " balance")
            
            let totalSupply = parseFloat((ethers.utils.formatEther((await deb0xContract.totalSupply())) ))
            console.log(totalSupply + " totalSupply")
            const feeShare = balance * 100 / totalSupply
            console.log(feeShare + " feeShare")
            setFeeSharePercentage(((Math.round(feeShare * 100) / 100).toFixed(2)).toString() + "%")
        }

        async function claimRewards() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)

            try {
                const tx = await deb0xContract.getRewardNative()

                tx.wait()
                    .then((result: any) => {
                        setNotificationState({
                            message: "You succesfully claimed your rewards.", open: true,
                            severity: "success"
                        })
                        //setLoading(false)

                    })
                    .catch((error: any) => {
                        setNotificationState({
                            message: "Rewards couldn't be claimed!", open: true,
                            severity: "error"
                        })
                        setLoading(false)
                    })
            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Your rewards haven't been claimed.", open: true,
                    severity: "info"
                })
            }


        }

        return (
            <Card variant="outlined" className="card-container">
                <CardContent>
                    <Typography variant="h4" component="div">
                        REWARDS
                    </Typography>
                    <Typography>
                        Your unclaimed rewards:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{rewardsUnclaimed}</strong>
                    </Typography>
                    <Typography>
                        Your share from fees:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{feeSharePercentage}</strong>
                    </Typography>
                </CardContent>
                <CardActions>
                    <LoadingButton className="submit-btn" loading={loading} variant="contained" onClick={claimRewards}>Collect</LoadingButton>
                </CardActions>
            </Card>
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

       

        useEffect(() => {
            console.log("user staked effect")
            setStakedAmount()
        }, [userStakedAmount]);

        useEffect(() => {
            console.log("total staked effect")
            totalAmountStaked()
        }, [totalStaked]);

        useEffect(() => {
            console.log("user unstaked effect")
            setUnstakedAmount()
        }, [userUnstakedAmount]);

        useEffect(() => {
            console.log("approval effect")
            setApproval()
        }, [approved]);

        async function setStakedAmount() {

            const deb0xContract = await Deb0x(library, deb0xAddress)

            const balance = await deb0xContract.balanceERC20(account)

            setUserStakedAmount(ethers.utils.formatEther(balance))
        }

        async function setUnstakedAmount() {
            const deb0xERC20Contract = await Deb0xERC20(library, deb0xERC20Address)

            const balance = await deb0xERC20Contract.balanceOf(account)

            setUserUnstakedAmount(ethers.utils.formatEther(balance))
        }

        async function setApproval() {
            const deb0xERC20Contract = await Deb0xERC20(library, deb0xERC20Address)

            const allowance = await deb0xERC20Contract.allowance(account, deb0xAddress)

            allowance > 0 ? setApproved(true) : setApproved(false)
        }

        async function totalAmountStaked() {

            const deb0xContract = await Deb0x(library, deb0xAddress)

            const totalSupply = await deb0xContract.totalSupply()

            setTotalStaked(ethers.utils.formatEther(totalSupply))
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

        async function unstake() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)

            try {
                const tx = await deb0xContract.unStakeERC20(ethers.utils.parseEther(amountToUnstake.toString()))

                tx.wait()
                    .then((result: any) => {
                        setNotificationState({
                            message: "Your tokens were succesfully unstaked.", open: true,
                            severity: "success"
                        })
                        setLoading(false)

                    })
                    .catch((error: any) => {
                        setLoading(false)
                        setNotificationState({
                            message: "Your tokens couldn't be unstaked!", open: true,
                            severity: "error"
                        })

                    })

            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Your tokens haven't been unstaked.", open: true,
                    severity: "info"
                })
                setLoading(false)
            }
        }

        async function stake() {
            setLoading(true)

            const signer = await library.getSigner(0)

            const deb0xContract = Deb0x(signer, deb0xAddress)

            try {
                const tx = await deb0xContract.stakeERC20(ethers.utils.parseEther(amountToStake.toString()))

                tx.wait()
                    .then((result: any) => {
                        setNotificationState({
                            message: "Your tokens were succesfully staked.", open: true,
                            severity: "success"
                        })
                        //setLoading(false)

                    })
                    .catch((error: any) => {
                        setNotificationState({
                            message: "Your tokens couldn't be staked!", open: true,
                            severity: "error"
                        })
                        setLoading(false)
                    })

            } catch (error: any) {
                setNotificationState({
                    message: "You rejected the transaction. Your tokens haven't been staked.", open: true,
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
                <CardContent>
                    <Typography>
                        Your staked amount:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{userStakedAmount} DBX</strong>
                    </Typography>
                    <Divider className="divider-pink" />
                    <Typography>
                        Your tokens in wallet:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{userUnstakedAmount} DBX</strong>
                    </Typography>
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
                    {approved && <LoadingButton disabled={!amountToStake} className="submit-btn" loading={loading} variant="contained" onClick={stake}>Stake</LoadingButton>}
                    {!approved && <LoadingButton className="submit-btn" loading={loading} variant="contained" onClick={approveStaking}>Approve Staking</LoadingButton>}
                </CardActions>
                </>
                : 

                <>
                <CardContent>
                    
                    <Typography>
                        Your staked amount:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{userStakedAmount} DBX</strong>
                    </Typography>
                    <Typography>
                        Your tokens in wallet:
                    </Typography>
                    <Typography variant="h6">
                        <strong>{userUnstakedAmount} DBX</strong>
                    </Typography>
                  

                    <Grid className="amount-row" container spacing={2}>
                        <Grid item>
                            <TextField value={amountToUnstake}
                                id="outlined-basic"
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
            console.log("total staked effect")
            totalAmountStaked()
        }, [totalStaked]);
    
        async function totalAmountStaked() {
    
            const deb0xContract = await Deb0x(library, deb0xAddress)
    
            const totalSupply = await deb0xContract.totalSupply()
    
            setTotalStaked(ethers.utils.formatEther(totalSupply))
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
                        <Grid item className="col col-md-6">
                            <TotalStaked/>
                        </Grid>
                        <Grid item className="col col-md-6">
                            <StakeUnstake/>
                            <RewardsPanel />
                        </Grid>
                    </div>
                </div>
            </Box>
        </>
    )
}