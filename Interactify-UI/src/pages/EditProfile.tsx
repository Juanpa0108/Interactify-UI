import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

const ENDPOINT_GET = '/api/user/profile';
const ENDPOINT_UPDATE = '/api/user/update';

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
		setLoading(true);
		setError('');
		fetch(ENDPOINT_GET, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		})
			.then(async (res) => {
				if (!res.ok) throw new Error('No se pudo cargar el perfil');
				const data = await res.json();
				setUser(data);
				setForm(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [token]);

	useEffect(() => {
		if (!user) return;
		setChanged(
			form.firstName !== user.firstName ||
			form.lastName !== user.lastName ||
			form.age !== user.age ||
			form.email !== user.email ||
			form.password !== user.password
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
		fetch(ENDPOINT_UPDATE, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(form),
		})
			.then(async (res) => {
				if (!res.ok) throw new Error('No se pudo guardar');
				const updated = await res.json();
				setUser(updated);
				setSaving(false);
				setChanged(false);
			})
			.catch((err) => {
				setError(err.message);
				setSaving(false);
			});
	};

	if (!token) {
		return null;
	}

	return (
		<div className="auth-page">
			<div className="auth-wrapper">
				<div className="auth-image" aria-hidden="true">
					<img src={import.meta.env.PUBLIC_URL + '/registerImage.avif'} alt="Edit profile" />
				</div>
				<div className="auth-card">
					<div className="auth-card-inner">
						<div className="auth-header">
							<img src={import.meta.env.PUBLIC_URL + '/logoInteractify.jpeg'} alt="logo" className="auth-logo" />
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
										<span className="sr-only">Age</span>
										<input
											name="age"
											type="number"
											value={form.age}
											onChange={handleChange}
											placeholder="Age"
											min={13}
											required
										/>
									</label>
									<label>
										<span className="sr-only">Email address</span>
										<input
											name="email"
											type="email"
											value={form.email}
											onChange={handleChange}
											placeholder="Email address"
											required
										/>
									</label>
								</div>
								<div className="input-row">
									<label>
										<span className="sr-only">Password</span>
										<input
											name="password"
											type="password"
											value={form.password}
											onChange={handleChange}
											placeholder="Password"
											required
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
