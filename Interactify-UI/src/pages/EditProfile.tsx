import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import '../styles/Register.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ENDPOINT_GET = `${API_URL}/api/user/profile`;
const ENDPOINT_UPDATE = `${API_URL}/api/user/update`;

type UserData = {
	firstName: string;
	lastName: string;
	age: number;
	email: string;
	password: string;
};

const EditProfile: React.FC = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState<UserData | null>(null);
	const [form, setForm] = useState<UserData>({ firstName: '', lastName: '', age: 0, email: '', password: '' });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [token, setToken] = useState<string | null>(null);
	const [changed, setChanged] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const t = localStorage.getItem('token');
		setToken(t);
		if (!t) {
			navigate('/login');
		}
	}, [navigate]);

	useEffect(() => {
		if (!token) return;
		
		const fetchProfile = async () => {
			setLoading(true);
			setError('');
			
			try {
				// Obtener el token actualizado de Firebase
				const currentUser = auth.currentUser;
				if (!currentUser) {
					throw new Error('Usuario no autenticado');
				}
				
				const idToken = await currentUser.getIdToken();
				
				const res = await fetch(ENDPOINT_GET, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${idToken}`,
						'Content-Type': 'application/json',
					},
				});
				
				if (!res.ok) throw new Error('No se pudo cargar el perfil');
				const data = await res.json();
				setUser(data);
				setForm({
					firstName: data.firstName || '',
					lastName: data.lastName || '',
					age: data.age || 0,
					email: data.email || '',
					password: '', // No mostramos la contraseña
				});
				setLoading(false);
			} catch (err: any) {
				setError(err.message);
				setLoading(false);
			}
		};
		
		fetchProfile();
	}, [token]);

	useEffect(() => {
		if (!user) return;
		setChanged(
			form.firstName !== user.firstName ||
			form.lastName !== user.lastName
		);
	}, [form, user]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: name === 'age' ? Number(value) : value }));
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError('');
		
		try {
			// Obtener el token actualizado de Firebase
			const currentUser = auth.currentUser;
			if (!currentUser) {
				throw new Error('Usuario no autenticado');
			}
			
			const idToken = await currentUser.getIdToken();
			
			const res = await fetch(ENDPOINT_UPDATE, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					firstName: form.firstName,
					lastName: form.lastName,
				}),
			});
			
			if (!res.ok) throw new Error('No se pudo guardar');
			const updated = await res.json();
			setUser(updated.user);
			setForm({
				...form,
				firstName: updated.user.firstName,
				lastName: updated.user.lastName,
			});
			setSaving(false);
			setChanged(false);
		} catch (err: any) {
			setError(err.message);
			setSaving(false);
		}
	};

	if (!token) {
		return null;
	}

	return (
		<div className="auth-page">
			<div className="auth-wrapper">
				<div className="auth-image" aria-hidden="true">
					<img src={'/registerImage.avif'} alt="Edit profile" />
				</div>
				<div className="auth-card">
					<div className="auth-card-inner">
						<div className="auth-header">
							<img src={'/logoInteractify.jpeg'} alt="logo" className="auth-logo" />
							<h1>Editar perfil</h1>
						</div>
						<p className="lead">Modifica tus datos personales</p>
						{loading ? (
							<p>Cargando…</p>
						) : error ? (
							<p style={{ color: 'red' }}>{error}</p>
						) : (
							<form className="auth-form" onSubmit={handleSave}>
								<div className="input-row">
									<label>
										<span className="sr-only">First name</span>
										<input
											name="firstName"
											type="text"
											value={form.firstName}
											onChange={handleChange}
											placeholder="First name"
											required
										/>
									</label>
									<label>
										<span className="sr-only">Last name</span>
										<input
											name="lastName"
											type="text"
											value={form.lastName}
											onChange={handleChange}
											placeholder="Last name"
											required
										/>
									</label>
								</div>
								<div className="input-row">
									<label>
										<span className="sr-only">Email address</span>
										<input
											name="email"
											type="email"
											value={form.email}
											placeholder="Email address"
											disabled
											style={{ opacity: 0.6, cursor: 'not-allowed' }}
										/>
									</label>
								</div>
								<button className="auth-btn" type="submit" disabled={!changed || saving}>
									{saving ? 'Guardando…' : 'Guardar cambios'}
								</button>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditProfile;
