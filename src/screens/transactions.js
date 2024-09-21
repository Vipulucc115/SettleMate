import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TransactionTable from './transactionTable';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

function Login() {
	let navigate = useNavigate();
	let location = useLocation();
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const [transactionName, setTransactionName] = useState('');

	useEffect(() => {
		async function authorize() {
			const authToken = localStorage.getItem('authToken');
			if (!authToken) navigate('/profile');
		}
		authorize();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const submitTransactionForm = async e => {
		e.preventDefault();
		const response = await fetch(`${process.env.REACT_APP_API_URL}/createtransaction`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: localStorage.getItem('authToken'),
				name: transactionName,
				tripid: location.state.tripid,
			}),
		});
		const json = await response.json();
		if (!json.success) {
			json.errors.forEach(error => {
				toast.error(error.msg, {});
			});
			if (json.logout === true) {
				localStorage.removeItem('authToken');
				localStorage.setItem('forcedLogOut', true);
				navigate('/profile');
			}
		} else {
			console.log(json);
			if (json.newAuthToken) localStorage.setItem('authToken', json.newAuthToken);
			navigate('/transaction', {
				state: {
					transactionid: json.transactionid,
					tripid: location.state.tripid,
				},
			});
		}
	};

	return (
		<div>
			<div style={{ position: 'relative' }}>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 1,
						width: '100%',
					}}
				>
					<TransactionTable tripid={location.state.tripid} />
				</div>
				<div
					className='lol'
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 10,
						padding: '10px',
						display: 'flex',
						gap: '10px',
					}}
				>
					<Button onClick={handleOpen} variant='contained'>
						Create New Transaction
					</Button>
					<Button
						onClick={() =>
							navigate('/trip', {
								state: { tripid: location.state.tripid },
							})
						}
						variant='contained'
					>
						Back To Trip
					</Button>
				</div>
			</div>
			<Modal open={open} onClose={handleClose} aria-labelledby='modal-modal-title' aria-describedby='modal-modal-description'>
				<Box sx={style}>
					<form
						onSubmit={submitTransactionForm}
						style={{
							width: '100%',
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'stretch',
							justifyContent: 'center',
							gap: '10px',
						}}
					>
						<TextField
							type='text'
							id='transactionName'
							value={transactionName}
							label='Transaction Name'
							onChange={e => setTransactionName(e.target.value)}
						/>
						<Button type='submit' variant='outlined'>
							Submit
						</Button>
					</form>
				</Box>
			</Modal>
		</div>
	);
}

export default Login;
