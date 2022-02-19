import {useState, forwardRef} from 'react'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

export default function SnackbarNotification(props:any) {

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
    
        props.setNotificationState({message: props.state.message, open: false,
        severity: props.state.severity});
      };

    return(
        <Snackbar open={props.state.open} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity={props.state.severity} sx={{ width: '100%' }}>
                {props.state.message}
            </Alert>
        </Snackbar>
    )
}