import { useState, useEffect } from 'react';
import {
    Tooltip, List, ListItem, Card, CardActions, CardContent, Button, Grid,
    ListItemText, ListItemButton, Typography, Box, CircularProgress, Divider
} from '@mui/material';

export function Stake(props: any): any {

    function StakePanel() {
        function stakedAmount() {
            return 0;
        }

        function totalAmountStaked() {
            return 0;
        }

        return (
            <Card  variant="outlined">
                <CardContent>
                    <Typography sx={{ mb: 1.5, ml: 15 }} variant="h4" component="div">
                        STAKE
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 8.17 }} variant="h5">
                        Total amount staked:
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 8.17 }} variant="h6">
                        {stakedAmount()}
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 8.17 }} variant="h5">
                        Your staked amount:
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 8.17 }} variant="h6">
                        {totalAmountStaked()}
                    </Typography>
                    <Divider />
                </CardContent>
                <CardActions>
                    <Button sx={{ ml: 18 }} variant="contained">Stake</Button>
                </CardActions>
            </Card>
        )

    }

    function RewardsPanel() {

        function rewardsAccrued() {
            return 0;
        }

        function feeShare() {
            return 0;
        }

        return (
            <Card  variant="outlined">
                <CardContent>
                    <Typography sx={{ mb: 1.5, ml: 10.75 }} variant="h4" component="div">
                        REWARDS
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h5">
                        Total rewards unclaimed:
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                        {rewardsAccrued()}
                    </Typography>
                    <Divider />
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h5">
                        Your share from fees:
                    </Typography>
                    <Typography sx={{ mb: 1.5, mt: 1.5, ml: 7.6 }} variant="h6">
                        {feeShare()}
                    </Typography>
                    <Divider />
                </CardContent>
                <CardActions>
                    <Button sx={{ ml: 16 }} variant="contained">Collect</Button>
                </CardActions>
            </Card>
        )
    }

    return (

        <>
            <Grid sx={{ mt: 25, ml: 30 }} container spacing={2}>
                <Grid item xs={3}>
                    <StakePanel />
                </Grid>

                <Grid item xs={3}>
                    <RewardsPanel />
                </Grid>
            </Grid>
        </>
    )
}