import {useState, Fragment} from 'react';
import { useWeb3React } from '@web3-react/core';
import { signMetaTxRequest } from '../../ethereum/signer';
import { createInstance } from '../../ethereum/forwarder'
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import Deb0x from "../../ethereum/deb0x"
import SnackbarNotification from './Snackbar';
import '../../componentsStyling/stepper.scss';
const deb0xAddress = "0x42C3FF9BCAC0b2f990195eFE5dfEEAC1b7E98eC6";
const steps = ['Provide public encryption key', 'Initialize Deb0x'];

export default function HorizontalLinearStepper(props: any) {
    const { account, library } = useWeb3React()
    const [encryptionKey, setEncryptionKey] = useState('')
    const [activeStep, setActiveStep] = useState(0);
    const [whichStepFailed, setStepFailed] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [notificationState, setNotificationState] = useState({})

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const fetchInitializeDeb0x = async (url:any, request:any) => {
        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: { 'Content-Type': 'application/json' },
          });

        let responseJson = await response.json()

        return responseJson
    }

    async function getEncryptionKey() {
        setLoading(true)

        library.provider.request({
            method: 'eth_getEncryptionPublicKey',
            params: [account],
        })
            .then((result: any) => {
                setEncryptionKey(result);
                handleNext()
                setStepFailed(undefined)
                setLoading(false)
                
            })
            .catch((error: any) => {
                setNotificationState({message: "You rejected to provide the public encryption key.", open: true,
                severity:"info"})
                setStepFailed(0)
                setLoading(false)
            });
        
    }

    

    async function initializeDeb0x() {
        setLoading(true)

        const url = "https://api.defender.openzeppelin.com/autotasks/5ce17e1f-6559-458b-b239-696042b4f7aa/runs/webhook/d090d479-22fb-450a-b747-40d46161c437/6uYfdFP7doXyqZ4RYximnc";

        const signer = await library.getSigner(0)

        const deb0xContract = Deb0x(library, deb0xAddress)

        const forwarder = createInstance(library)
        const from = await signer.getAddress();
        const data = deb0xContract.interface.encodeFunctionData('setKey', [encryptionKey])
        const to = deb0xContract.address

        try {
            const request = await signMetaTxRequest(library, forwarder, { to, from, data });

            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            })
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data)
                    const {tx: txReceipt} = JSON.parse(data.result)
                    
                    if(txReceipt.status == 1){
                        setNotificationState({message: "Deb0x was succesfully initialized.", open: true,
                                severity:"success"})
                                setLoading(false)
                                props.onDeboxInitialization(true)
                    } else {
                        setNotificationState({message: "Deb0x couldn't be initialized!", open: true,
                            severity:"error"})
                            setLoading(false)
                    }
                })
            } catch(error: any) {
                    setNotificationState({message: "You rejected the transaction. Deb0x was not initialized.", open: true,
                        severity:"info"})
                        setLoading(false)
            }
    }

    return (
        <>
            <SnackbarNotification state={notificationState} setNotificationState={setNotificationState}/>
            <Box className="stepper-box" sx={{ width: '100%', maxWidth: 1080 }}>
                <Stepper activeStep={activeStep} className="stepper">
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: {
                            optional?: React.ReactNode;
                            error?: boolean;
                        } = {};
                        if (whichStepFailed === index) {
                            labelProps.optional = (
                            <Typography variant="caption" color="error">
                                {(activeStep === 0) ? "User didn't provide encryption key" : "User rejected transaction"}
                            </Typography>
                            );
                            labelProps.error = true;
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps} >{label} </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                {<Fragment>
                    <Box
                        className={activeStep === steps.length - 1 ? 'right button-box' : 'left button-box'}
                        sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                        <LoadingButton className='init-btn' loading={loading} sx={{ marginLeft: 5 }} variant="contained" onClick={
                            (activeStep === 0) ? getEncryptionKey : initializeDeb0x
                        }>
                            {activeStep === steps.length - 1 ? 'Initialize' : 'Provide'}
                        </LoadingButton>
                    </Box>
                </Fragment>
                }
            </Box>
        </>
    );
}
