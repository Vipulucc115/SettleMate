import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import List from '@mui/material/List';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { useDropzone } from 'react-dropzone';
import { Table, TableHead, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material';
const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	maxWidth: '50%',
	height: 'auto',
	maxHeight: '50%',
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexDirection: 'column',
};
const basestyle = {
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	padding: '20px',
	borderWidth: 2,
	borderRadius: 2,
	borderColor: '#eeeeee',
	borderStyle: 'dashed',
	backgroundColor: '#fafafa',
	color: '#bdbdbd',
	outline: 'none',
	transition: 'border .24s ease-in-out',
};

const thumbsContainer = {
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	justifyContent: 'center',
	overflow: 'auto',
	marginTop: 16,
};
const thumb = {
	display: 'inline-flex',
	borderRadius: 2,
	border: '1px solid #eaeaea',
	marginBottom: 8,
	marginRight: 8,
	width: 100,
	height: 100,
	padding: 4,
	boxSizing: 'border-box',
};

const thumbInner = {
	display: 'flex',
	minWidth: 0,
	overflow: 'hidden',
};

const img = {
	display: 'block',
	width: 'auto',
	height: '100%',
};
function not(a, b) {
	return a.filter(value => b.indexOf(value) === -1);
}

function intersection(a, b) {
	return a.filter(value => b.indexOf(value) !== -1);
}

function union(a, b) {
	return [...a, ...not(b, a)];
}

function EditTransaction() {
	let navigate = useNavigate();
	let location = useLocation();
	const [content, setContent] = useState(0);
	const [name, setName] = useState('');
	const [desc, setDesc] = useState('');
	const [amt, setAmt] = useState(-1);
	const [switchVal, setSwitchVal] = useState(true);
	const [checked, setChecked] = useState([]);
	const [bill, setBill] = useState('');
	const [transactionEnabled, setTransactionEnabled] = useState('Enabled');
	const [fileOpen, setfileModalOpen] = React.useState(false);
	const [files, setFiles] = useState(null);
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [memmap, setMap] = useState({});
	const [amtDist, setAmtDist] = useState({});
	// useEffect(() => {
	// 	console.log(amtDist);
	// }, [amtDist]);
	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			'image/*': [],
		},
		onDrop: acceptedFiles => {
			const file = acceptedFiles[0];
			if (file) {
				const fileWithPreview = Object.assign(file, {
					preview: URL.createObjectURL(file),
				});
				setFiles(fileWithPreview);
			}
		},
	});

	const thumbs = files ? (
		<div style={thumb} key={files.name}>
			<div style={thumbInner}>
				<img
					src={files.preview}
					style={img}
					onLoad={() => {
						URL.revokeObjectURL(files.preview);
					}}
					alt='Loading...'
				/>
			</div>
		</div>
	) : null;
	// useEffect(() => {
	// 	console.log(checked);
	// }, [checked]);
	const [items, setItems] = React.useState([]);
	const handleToggle = value => () => {
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];

		if (currentIndex === -1) {
			newChecked.push(value);
		} else {
			newChecked.splice(currentIndex, 1);
		}

		setChecked(newChecked);
	};
	const handleToggleAll = items => () => {
		if (numberOfChecked(items) === items.length) {
			setChecked(not(checked, items));
		} else {
			setChecked(union(checked, items));
		}
	};
	const numberOfChecked = items => intersection(checked, items).length;

	useEffect(() => {
		async function authorize() {
			const authToken = localStorage.getItem('authToken');
			if (!authToken) navigate('/profile');
			else fetchData();
		}
		async function fetchData() {
			try {
				const response = await fetch(`${process.env.REACT_APP_API_URL}/getTransactionData`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token: localStorage.getItem('authToken'),
						tripid: location.state.tripid,
						transactionid: location.state.transactionid,
					}),
				});
				const json = await response.json();
				// console.log(json);
				if (!json.success) {
					json.errors.forEach(error => {
						toast.error(error.msg, {});
					});
					if (json.logout === true) {
						localStorage.removeItem('authToken');
						localStorage.setItem('forcedLogOut', true);
						navigate('/');
					}
				} else {
					if (json.newAuthToken) localStorage.setItem('authToken', json.newAuthToken);
					// console.log(json);
					setAmt(json.amt);
					setDesc(json.desc);
					setName(json.name);
					setBill(json.bill);
					setSwitchVal(json.switchVal);
					setChecked(json.damg);
					setItems(json.members);
					setMap(json.memmap);
					setAmtDist(json.damgmap);
				}
			} catch (error) {
				console.error('Error fetching data :', error);
			}
		}
		authorize();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const uploadImages = async () => {
		if (files === null) {
			toast.error('Select an Image');
			return;
		}
		// console.log(files);
		setIsButtonDisabled(true);
		toast.info('Uploading image', {
			autoClose: false,
			toastId: 'uploadImage',
		});
		const formData = new FormData();
		formData.append('files', files);
		const response = await fetch(`${process.env.REACT_APP_API_URL}/uploadDrive`, {
			method: 'POST',
			body: formData,
		});
		const result = await response.json();
		console.log(result);
		for (const glink of result.files) {
			setBill(glink);
		}
		setIsButtonDisabled(false);
		setfileModalOpen(false);
		toast.dismiss('uploadImages');
		toast.success('Image Uploaded!');
		setFiles(null);
	};
	const updateTransaction = async () => {
		let sum = 0;
		for (let i in checked) sum += Number(amtDist[checked[i]]) || 0;
		if (sum !== Number(amt)) {
			toast.error('The sum of distributed amount should be equal to total amount!', {});
			return;
		}
		// console.log(name);
		// console.log(desc);
		// console.log(bill);
		// console.log(amt);
		// console.log(transactionEnabled);
		// console.log(checked);
		// console.log(amtDist);
		const temp = [];
		for (let i in checked)
			temp.push({
				person: checked[i],
				amt: Number(amtDist[checked[i]]) || 0,
			});
		const data = {
			bill: bill,
			currentStatus: transactionEnabled,
			amt: amt,
			name: name,
			desc: desc,
			distributedAmong: temp,
		};
		const response = await fetch(`${process.env.REACT_APP_API_URL}/updateTransaction`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: localStorage.getItem('authToken'),
				tripid: location.state.tripid,
				transactionid: location.state.transactionid,
				data: data,
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
				navigate('/');
			}
		} else {
			navigate('/transaction', { state: { tripid: location.state.tripid, transactionid: location.state.transactionid } });
		}
	};

	return (
		<div>
			<Modal
				open={fileOpen}
				onClose={() => {
					setfileModalOpen(false);
					setFiles([]);
				}}
			>
				<Box sx={style}>
					<Typography
						{...getRootProps({ basestyle })}
						id='modal-modal-titleclearChat'
						variant='h6'
						component='h2'
						style={{
							display: 'flex',
							justifyContent: 'center',
							flexDirection: 'column',
							textAlign: 'center',
							backgroundColor: '#f5f5f5',
							padding: '10px',
							border: '2px dashed black',
							borderRadius: '10px',
							overflow: 'hidden',
						}}
					>
						<input {...getInputProps()} />
						Drag & Drop Files or Click to Select Files
						<aside style={thumbsContainer}>{thumbs}</aside>
					</Typography>
					<Button sx={{ mt: 2 }} variant='contained' onClick={uploadImages} disabled={isButtonDisabled}>
						Upload Bill Image
					</Button>
				</Box>
			</Modal>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					paddingTop: '10px',
					gap: '10px',
				}}
			>
				<Button
					variant='contained'
					onClick={() =>
						navigate('/transaction', {
							state: {
								tripid: location.state.tripid,
								transactionid: location.state.transactionid,
							},
						})
					}
				>
					Cancel Edit
				</Button>
				<Button variant='contained' onClick={updateTransaction}>
					Save Edit
				</Button>
			</div>
			{content === 0 && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '10px',
					}}
				>
					<div
						style={{
							display: 'flex',
							gap: '40px',
							justifyContent: 'center',
							paddingTop: '20px',
						}}
					>
						<TextField label='Transaction Name' value={name} onChange={e => setName(e.target.value)} />
						<TextField label='Amount' value={amt} onChange={e => setAmt(e.target.value)} />
						<div>
							<Typography>{transactionEnabled}</Typography>
							<Switch
								checked={switchVal}
								onChange={e => {
									const newSwitchVal = e.target.checked;
									setTransactionEnabled(newSwitchVal ? 'Enabled' : 'Disabled');
									setSwitchVal(newSwitchVal);
								}}
								name='Enable'
								inputProps={{
									'aria-label': 'secondary checkbox',
								}}
							/>
						</div>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							gap: '10px',
						}}
					>
						{bill.length > 0 && (
							<Button variant='contained' onClick={() => window.open(`https://drive.google.com/uc?export=view&id=${bill}`, '_blank')}>
								View bill Image
							</Button>
						)}
						<Button variant='contained' onClick={() => setfileModalOpen(true)}>
							upload Bill Image
						</Button>
						{bill.length > 0 && (
							<Button variant='contained' onClick={() => setBill('')}>
								remove Bill Image
							</Button>
						)}
					</div>
					<div
						style={{
							padding: '10px',
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<TextField
							label='Transaction Description'
							onChange={e => setDesc(e.target.value)}
							value={desc}
							style={{ width: '50%' }}
							multiline
							rows={8}
						/>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<Button variant='contained' onClick={() => setContent(1)}>
							Next
						</Button>
					</div>
				</div>
			)}
			{content === 1 && (
				<div>
					<div
						style={{
							width: '100%',
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<Card style={{ width: '50%', height: '50vh' }}>
							<CardHeader
								avatar={
									<Checkbox
										onClick={handleToggleAll(items)}
										checked={numberOfChecked(items) === items.length && items.length !== 0}
										indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
										disabled={items.length === 0}
										inputProps={{
											'aria-label': 'all items selected',
										}}
									/>
								}
								title={'Amount to be Distributed Among'}
								subheader={`${numberOfChecked(items)}/${items.length} selected`}
							/>
							<Divider />
							<List
								sx={{
									height: '90%',
									bgcolor: 'background.paper',
									overflow: 'auto',
								}}
								dense
								component='div'
								role='list'
							>
								{items.map(value => {
									const labelId = `transfer-list-all-item-${value._id}-label`;

									return (
										<ListItemButton key={value} role='listitem' onClick={handleToggle(value)}>
											<ListItemIcon>
												<Checkbox
													checked={checked.indexOf(value) !== -1}
													tabIndex={-1}
													disableRipple
													inputProps={{
														'aria-labelledby': labelId,
													}}
												/>
											</ListItemIcon>
											<ListItemText id={value} primary={`${memmap[value].name}  ${memmap[value].email}`} />
										</ListItemButton>
									);
								})}
							</List>
						</Card>
					</div>
					<div
						style={{
							padding: '10px',
							display: 'flex',
							justifyContent: 'center',
							gap: '10px',
						}}
					>
						<Button variant='contained' onClick={() => setContent(0)}>
							Prev
						</Button>
						<Button variant='contained' onClick={() => setContent(2)}>
							Next
						</Button>
					</div>
				</div>
			)}
			{content === 2 && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
						<Button
							variant='contained'
							onClick={() => {
								let temp = {};
								let l = checked.length;
								for (let i in checked) temp[checked[i]] = amt / l;
								setAmtDist(temp);
							}}
						>
							Distribute Equally
						</Button>
					</div>
					<div style={{ width: '50%', height: '50vh' }}>
						<TableContainer component={Paper}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Name</TableCell>
										<TableCell>Email</TableCell>
										<TableCell>Amount</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{checked.map((item, index) => (
										<TableRow key={index}>
											<TableCell>{memmap[item].name}</TableCell>
											<TableCell>{memmap[item].email}</TableCell>
											<TableCell>
												<TextField
													value={Number(amtDist[item] || 0)}
													onChange={e => {
														if (e.target.value < 0) {
															return;
														}
														const newAmtDist = {
															...amtDist,
															[item]: Number(e.target.value),
														};
														setAmtDist(newAmtDist);
													}}
													variant='outlined'
													type='number'
													size='small'
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</div>
					<div
						style={{
							padding: '10px',
							display: 'flex',
							justifyContent: 'center',
							gap: '10px',
						}}
					>
						<Button variant='contained' onClick={() => setContent(1)}>
							Prev
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export default EditTransaction;
