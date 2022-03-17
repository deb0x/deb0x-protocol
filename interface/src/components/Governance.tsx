import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../ethereum/deb0x"
import {
    Tooltip, List, ListItem, Card, CardActions, CardContent, Button, Grid, Box,
    ListItemText, ListItemButton, Typography, TextField, CircularProgress, Divider
} from '@mui/material';
import '../componentsStyling/Card.css'

const axios = require('axios')
const deb0xAddress = "0xf98E2331E4A7a542Da749978E2eDC4a572E81b99"


export function Governance(props: any): any {
    const { account, library } = useWeb3React()
    const [loading, setLoading] = useState(true)
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState<boolean|undefined>(undefined)



    function VoteFeePanel() {
        return (
            <Card variant="outlined" className="card-container">
                <CardContent>
                    <Typography sx={{ mb: 1.5 }} variant="h4" component="div">
                        Vote Fee
                    </Typography>
                    <Divider className="divider-pink" />
                    <Typography sx={{mt: 1.5 }} >
                        Proposals to change fee to: 
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} variant="h6">
                        <strong>11%</strong>
                    </Typography>
                    <Divider className="divider-pink" />
                    <Typography sx={{ mb: 1.5, mt: 1.5 }} variant="h5">
                        
                    </Typography>
                  
                    <Typography sx={{ mb: 1.5, mt: 1.5, fontSize: "16px" }} variant="h6">
                        We want to raise this to 11% because 5% is to low and people can send to many transactions
                    </Typography>
                    <Divider className="divider-pink" />
                </CardContent>
                <CardActions>
                    <Box sx={{ mt: 3 ,display:"flex", justifyContent:"center", width:"100%"}}>
                        <Button className="submit-vote approve-btn" variant="contained" color="primary" sx={{mr:'20px'}}>Yes</Button>
                        <Button className="submit-vote decline-btn" variant="contained" color="error">No</Button>
                    </Box>
                </CardActions>
            </Card>
        )
    }

    function ProposeFeePanel() {
        return (
            <Card variant="outlined" className="card-container">
                <CardContent>
                    <Typography sx={{ mb: 1.5 }} variant="h4" component="div">
                        Propose Fee
                    </Typography>
                    <Divider className="divider-pink" />
                    <Typography sx={{ mt: 1.5 }}>
                        Submit your proposal
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5 }} variant="h6">
                        <TextField sx={{width:"100%"}} id="outlined-basic" label="Motivation" variant="outlined" />
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5 }} variant="h6">
                        <TextField sx={{width:"100%"}} id="outlined-basic" label="Value" variant="outlined" />
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button className="submit-btn" variant="contained" color="secondary">Submit</Button>
                </CardActions>
            </Card>
        )
    }

    //need to be modified
    function GetMessages() {
        const proposals = [{motivation:"make fee 100", value:100, votes:12 }, 
                    {motivation:"make fee 500", value:500, votes:5}]

        const [fetchedMessages, setFetchedMessages] = useState<any>([])

        useEffect(() => {
            processMessages()
        }, []);

        async function processMessages() {
            const deb0xContract = Deb0x(library, deb0xAddress)
            
            const senderAddresses = await deb0xContract.fetchMessageSenders(account)

            const cidsPromises = senderAddresses.map(async function(sender:any){
                return { cids: await deb0xContract.fetchMessages(account, sender), sender: sender}
            })

            const cids = await Promise.all(cidsPromises)

            console.log(cids)

            const encryptedMessagesPromisesArray = cids.map(async function(cidArray: any) {
                console.log(cidArray)
               

            })

            const encryptedMessages = await Promise.all(encryptedMessagesPromisesArray)
            
            console.log(encryptedMessages)
            
            setFetchedMessages(encryptedMessages.flat())
            setLoading(false)
        }

        if(!loading) {
            if (fetchedMessages.length == 0) {
                return (
                    <>
                        <div >
                            <Typography variant="h5"
                                gutterBottom
                                component="div"
                                sx={{marginLeft: .8, marginTop: 3}}
                            >
                                No messages founded.
                            </Typography>
                        </div>
                    </>
                )
            } else {
                return (
                    <Box sx={{ width: '100%', maxWidth: 1080 }}>
                        <List>
                            {fetchedMessages.map((message: any, i: any) => {
                                return (
                                    <p></p>
                                )
                            })}
                        </List>
                    </Box>
                )
            }
        } else {
            return (
                <CircularProgress/>
            )
        }

    }



    return (
        <>
            <Grid className="cards-grid" sx={{ mt: 25, alignItems:"center"}} container spacing={2}>
                <Grid sx={{mr:5}} item xs={3}>
                    <VoteFeePanel />
                </Grid>

                <Grid sx={{ml:5}} item xs={3}>
                    <ProposeFeePanel />
                </Grid>
            </Grid>
        </>
    )
}