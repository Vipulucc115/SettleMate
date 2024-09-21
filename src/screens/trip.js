import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MemberTable from './membertable';
import io from 'socket.io-client';
import { useDropzone } from 'react-dropzone';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

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
const styleImage = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 'auto',
	height: 'auto',
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

function Trip() {
	let navigate = useNavigate();
	const location = useLocation();
	const [socket, setSocket] = useState(null);
	const { tripid } = location.state || {};
	const [data, setData] = useState({ owner: {} });
	const [chat, setChat] = useState([]);
	const [mapId2Name, setMapId2Name] = useState({});
	const [myUid, setMyUid] = useState(null);
	const [msgText, setMsgText] = useState('');
	const [inviteEmail, setInviteEmail] = useState('');
	const [dense, setDense] = useState(false);
	const [image, setImage] = useState({ from: '', date: '', msg: '' });
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);

	const [clearChatOpen, setClearChatModalOpen] = useState(false);
	const [fileOpen, setfileModalOpen] = useState(false);
	const [imageOpen, setImageModalOpen] = useState(false);
	const [inviteOpen, setInviteModal] = useState(false);

	const chatEndRef = useRef(null);
	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chat]);

	const [files, setFiles] = useState([]);
	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			'image/*': [],
		},
		onDrop: acceptedFiles => {
			setFiles(prevFiles => {
				const newData = acceptedFiles.map(file =>
					Object.assign(file, {
						preview: URL.createObjectURL(file),
					})
				);
				return [...prevFiles, ...newData];
			});
		},
	});
	const thumbs = files.map(file => (
		<div style={thumb} key={file.name}>
			<div style={thumbInner}>
				<img
					src={file.preview}
					style={img}
					onLoad={() => {
						URL.revokeObjectURL(file.preview);
					}}
					alt='Loading...'
				/>
			</div>
		</div>
	));

	useEffect(() => {
		async function authorize() {
			const authToken = localStorage.getItem('authToken');
			// console.log(authToken)
			if (!authToken) navigate('/');
			else {
				fetchData();
			}
		}
		async function fetchData() {
			try {
				const response = await fetch(`${process.env.REACT_APP_API_URL}/getTripData`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token: localStorage.getItem('authToken'),
						tripid: tripid,
					}),
				});
				const json = await response.json();
				if (json.success) {
					setData(json.data);
					setMyUid(json.userId);
					setMapId2Name(json.mapId2Name);
					setChat(json.chat);
					// console.log(json.chat);
					// console.log(data);
				} else {
					json.errors.forEach(error => {
						toast.error(error.msg, {});
					});
					if (json.logout === true) {
						localStorage.removeItem('authToken');
						localStorage.setItem('forcedLogOut', true);
						navigate('/profile');
					}
				}
			} catch (error) {
				console.error('Error fetching trip Data :', error);
			}
		}
		authorize();
		return () => {
			files.forEach(file => URL.revokeObjectURL(file.preview));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const newSocket = io(process.env.REACT_APP_API_URL);
		setSocket(newSocket);
		newSocket.on('connect', () => {
			// console.log('Connected to Socket.IO server');
			newSocket.emit('joinRoom', `${tripid}`);
		});

		newSocket.on('bcast', message => {
			// console.log(message);
			setChat(chat => [...chat, message]);
			// console.log(chat);
			// console.log(data.owner._id === message.from && message.msg==='Admin cleared the chat!')
			// console.log(message)
			// console.log('Admin cleared the chat!')
			// console.log(data)
			if (data.owner._id === message.from && message.msg === 'Admin cleared the chat!') setChat([message]);
		});
		return () => {
			newSocket.off('connect');
			newSocket.off('bcast');
			newSocket.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const msgTextSubmit = async e => {
		if (!Array.isArray(e)) e.preventDefault();
		if (msgText.length === 0 && !Array.isArray(e)) {
			toast.error('Cannot Send Empty message');
			return;
		}
		const data = {
			msg: !Array.isArray(e) ? msgText : e[0],
			isImage: !Array.isArray(e) ? false : e[1],
			from: myUid,
			date: new Date(),
		};
		console.log('sending msg');
		console.log(data);
		socket.emit('msg', { message: data, roomId: tripid });
		const response = await fetch(`${process.env.REACT_APP_API_URL}/addChat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: localStorage.getItem('authToken'),
				tripid: tripid,
				msg: data,
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
			if (!Array.isArray(e)) setMsgText('');
		}
	};
	const clearChat = async () => {
		if (myUid === data.owner._id) setClearChatModalOpen(true);
		else msgTextSubmit('Admin please clear the chat!');
	};
	const confirmClearChat = async () => {
		const response = await fetch(`${process.env.REACT_APP_API_URL}/clearChat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: localStorage.getItem('authToken'),
				tripid: tripid,
			}),
		});
		const json = await response.json();
		console.log(json);
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
			setClearChatModalOpen(false);
			msgTextSubmit(['Admin cleared the chat!', false]);
		}
	};
	const uploadImages = async () => {
		if (files.length === 0) {
			toast.error('Select Images');
			return;
		}
		// console.log(files);
		setIsButtonDisabled(true);
		toast.info('Uploading images', {
			autoClose: false,
			toastId: 'uploadImages',
		});
		const formData = new FormData();
		for (const file of files) formData.append('files', file);
		const response = await fetch(`${process.env.REACT_APP_API_URL}/uploadDrive`, {
			method: 'POST',
			body: formData,
		});
		const result = await response.json();
		console.log(result);
		for (const glink of result.files) {
			console.log(glink);
			msgTextSubmit([glink, true]);
		}
		setIsButtonDisabled(false);
		setfileModalOpen(false);
		toast.dismiss('uploadImages');
		toast.success('Images Uploaded!');
		setFiles([]);
	};

	const sendInvite = async () => {
		const response = await fetch(`${process.env.REACT_APP_API_URL}/invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: localStorage.getItem('authToken'),
				tripid: tripid,
				email: inviteEmail,
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
				navigate('/profile');
			}
		} else {
			setInviteModal(false);
			setInviteEmail('');
			json.errors.forEach(error => {
				toast.success(error.msg, {});
			});
		}
	};

	return (
		<div style={{ overflow: 'hidden', height: '100%' }}>
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
						Upload Images to Chat
					</Button>
				</Box>
			</Modal>
			<Modal
				open={clearChatOpen}
				onClose={() => {
					setClearChatModalOpen(false);
				}}
				aria-labelledby='modal-modal-titleclearChat'
				aria-describedby='modal-modal-descriptionclearChat'
			>
				<Box sx={style}>
					<Typography id='modal-modal-titleclearChat' variant='h6' component='h2' style={{ textAlign: 'center' }}>
						Irrversible Action
					</Typography>
					<Button id='modal-modal-descriptionclearChat' sx={{ mt: 2 }} variant='contained' onClick={confirmClearChat}>
						Confirm Clear Chat
					</Button>
				</Box>
			</Modal>
			<Modal
				open={imageOpen}
				onClose={() => {
					setImageModalOpen(false);
				}}
				aria-labelledby='modal-modal-titleimage'
				aria-describedby='modal-modal-descriptionimge'
			>
				<Box sx={styleImage}>
					<Typography id='modal-modal-titleimage' variant='h6' component='h2' style={{ textAlign: 'center' }}>
						{mapId2Name[image.from]} - {new Date(image.date).toLocaleDateString()} {new Date(image.date).toLocaleTimeString()}
					</Typography>
					<img
						crossorigin='anonymous'
						src={`https://drive.lienuc.com/uc?id=${image.msg}`}
						alt='Loading...'
						style={{ maxHeight: '70vh', maxWidth: '70vw' }}
					/>
					<Button sx={{ mt: 2 }} variant='contained' onClick={() => window.open(`https://drive.google.com/uc?export=view&id=${image.msg}`, '_blank')}>
						View Image on a new TAb
					</Button>
				</Box>
			</Modal>
			<Modal
				open={inviteOpen}
				onClose={() => {
					setInviteModal(false);
				}}
				aria-labelledby='modal-modal-titleinvite'
				aria-describedby='modal-modal-descriptioninvite'
			>
				<Box sx={style}>
					<TextField
						type='text'
						id='text'
						value={inviteEmail}
						label='Account Email'
						onChange={e => setInviteEmail(e.target.value)}
						style={{ width: '30vw' }}
						variant='outlined'
						autoComplete='off'
					/>
					<Button id='modal-modal-descriptioninvite' sx={{ mt: 2 }} variant='contained' onClick={sendInvite}>
						Send Invite
					</Button>
				</Box>
			</Modal>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '49.7% 0.6% 49.7%',
					height: '100%',
				}}
			>
				<div style={{ overflow: 'hidden', height: '100%' }}>
					<div style={{ height: '35%' }}>
						<Typography
							variant='h2'
							gutterBottom
							style={{
								marginLeft: '10px',
								color: '#1976D2',
								textAlign: 'center',
							}}
						>
							{data.name}
						</Typography>
						<Typography
							variant='h4'
							gutterBottom
							style={{
								marginLeft: '10px',
								color: '#1976D2',
								textAlign: 'center',
							}}
						>
							Managed By : {data.owner.name}
						</Typography>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-evenly',
								gap: '10px',
							}}
						>
							<Button
								variant='contained'
								onClick={() =>
									navigate('/transactions', {
										state: { tripid: tripid },
									})
								}
							>
								Transactions
							</Button>
							<Button
								variant='contained'
								onClick={() =>
									navigate('/transfer', {
										state: { tripid: tripid },
									})
								}
							>
								Minimum Transfers
							</Button>
							{myUid === data.owner._id && (
								<Button
									variant='contained'
									onClick={() => {
										setInviteModal(true);
									}}
								>
									Invite Members
								</Button>
							)}
							{myUid === data.owner._id && (
								<Button
									variant='contained'
									onClick={() =>
										navigate('/edittrip', {
											state: { tripid: tripid },
										})
									}
								>
									Edit Trip
								</Button>
							)}
						</div>
					</div>
					<div style={{ overflowY: 'scroll', height: '65%' }}>
						<MemberTable tripid={tripid} />
					</div>
				</div>
				<div style={{ backgroundColor: '#1976D2', height: '100%' }}></div>
				<div style={{ maxHeight: '93vh' }}>
					<div style={{ height: '80%', overflow: 'scroll' }}>
						<List dense={dense}>
							{chat.map((chat, index) => (
								<ListItem key={index}>
									<ListItemText
										align={chat.from === myUid ? 'right' : 'left'}
										primary={
											<Fragment>
												{chat.isImage ? (
													<Button
														variant='outlined'
														size='small'
														onClick={() => {
															setImage(chat);
															setImageModalOpen(true);
														}}
													>
														Image
													</Button>
												) : (
													chat.msg
												)}
											</Fragment>
										}
										secondary={`${mapId2Name[chat.from]} - ${new Date(chat.date).toLocaleDateString()} ${new Date(
											chat.date
										).toLocaleTimeString()}`}
										sx={{ whiteSpace: 'normal' }}
									/>
								</ListItem>
							))}
							<div ref={chatEndRef} />
						</List>
					</div>
					<form
						onSubmit={msgTextSubmit}
						style={{
							display: 'grid',
							gridTemplateColumns: '80% 20%',
							height: '10%',
						}}
					>
						<div
							style={{
								height: 'auto',
								width: '100%',
								paddingLeft: '10px',
							}}
						>
							<TextField
								type='text'
								id='text'
								value={msgText}
								label='Message'
								onChange={e => setMsgText(e.target.value)}
								style={{ width: '100%' }}
								variant='standard'
								autoComplete='off'
							/>
						</div>
						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									paddingTop: '10px',
								}}
							>
								<Button variant='contained' type='submit'>
									Send Text
								</Button>
							</div>
						</div>
					</form>
					<div
						style={{
							height: '10%',
							display: 'grid',
							gridTemplateColumns: '33% 33% 33%',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Button
								variant='contained'
								onClick={() => {
									setfileModalOpen(true);
								}}
							>
								Upload Image
							</Button>
						</div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Button variant='contained' onClick={clearChat}>
								Clear Chat
							</Button>
						</div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Button
								variant='contained'
								onClick={() => {
									setDense(!dense);
								}}
							>
								Toggle Density
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Trip;
