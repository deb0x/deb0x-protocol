import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import Deb0x from "../ethereum/deb0x"
import {
    Tooltip, List, ListItem, Card, CardActions, CardContent, Button, Grid, Box,
    ListItemText, ListItemButton, Typography, TextField, CircularProgress, Divider
} from '@mui/material';

const axios = require('axios')
const deb0xAddress = "0xf98E2331E4A7a542Da749978E2eDC4a572E81b99"


export function Governance(props: any): any {
    const { account, library } = useWeb3React()
    const [loading, setLoading] = useState(true)
    const [encryptionKeyInitialized, setEncryptionKeyInitialized] = useState<boolean|undefined>(undefined)



    function VoteFeePanel() {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography sx={{ mb: 1.5,textAlign:"center" }} variant="h4" component="div">
                        Vote Fee
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h5">
                        Proposals to change fee to: 
                    </Typography>
                    <Typography sx={{ textAlign:"center"}} variant="h4">
                        11%
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h5">
                        
                    </Typography>
                  
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                        We want to raise this to 11% because 5% is to low and people can send to many transactions
                    </Typography>
                    <Divider />
                    <Box sx={{ mt: 3 ,display:"flex", justifyContent:"center"}}>
                        <Button variant="contained" color="primary" sx={{mr:'20px'}}>Yes</Button>
                        <Button variant="contained" color="error">No</Button>
                    </Box>

                </CardContent>
                <CardActions>
                </CardActions>
            </Card>
        )
    }

    function ProposeFeePanel() {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography sx={{ mb: 1.5, ml: 10.75 }} variant="h4" component="div">
                        Propose Fee
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h5">
                        Submit your proposal
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                    <TextField id="outlined-basic" label="Motivation" variant="outlined" />
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                    <TextField id="outlined-basic" label="Value" variant="outlined" />
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 3.5, ml: 15 }} variant="h5">
                    <Button variant="contained" color="secondary">Submit</Button>
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                    </Typography>
                </CardContent>
                <CardActions>
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
            <Grid sx={{ mt: 25, ml: 30, alignItems:"center"}} container spacing={2}>
                <Grid item xs={3}>
                    <VoteFeePanel />
                </Grid>

                <Grid item xs={3}>
                    <ProposeFeePanel />
                </Grid>
            </Grid>
        </>
    )
}