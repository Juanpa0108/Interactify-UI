import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import '../components/Toast.css';
import { useNavigate } from 'react-router-dom';

import type { User } from 'firebase/auth';
import '../styles/EditProfile.css';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ENDPOINT_GET = `${API_URL}/api/user/profile`;
const ENDPOINT_UPDATE = `${API_URL}/api/user/update`;
const ENDPOINT_CHANGE_PASSWORD = `${API_URL}/api/auth/change-password`;
const ENDPOINT_DELETE = `${API_URL}/api/auth/delete`;

type UserData = {
	firstName: string;
	lastName: string;
	email: string;
};

const EditProfile: React.FC = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState<UserData | null>(null);
	const [form, setForm] = useState<UserData>({ firstName: '', lastName: '', email: '' });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
	const [changed, setChanged] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [changingPassword, setChangingPassword] = useState(false);
	const [toastMessage, setToastMessage] = useState('¡Cambios guardados correctamente!');

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((fbUser) => {
			if (!fbUser) {
				setFirebaseUser(null);
				setUser(null);
				setForm({ firstName: '', lastName: '', email: '' });
				navigate('/login');
				return;
			}
			setFirebaseUser(fbUser);
		});

		return () => unsubscribe();
	}, [navigate]);

	useEffect(() => {
		if (!firebaseUser) return;
		
		const fetchProfile = async () => {
			setLoading(true);
			setError('');
			
			try {
				const idToken = await firebaseUser.getIdToken();
				
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
					email: data.email || '',
				});
				setLoading(false);
			} catch (err: any) {
				setError(err.message);
				setLoading(false);
			}
		};
		
		void fetchProfile();
	}, [firebaseUser]);

	useEffect(() => {
		if (!user) return;
		setChanged(
			form.firstName !== user.firstName ||
			form.lastName !== user.lastName
		);
	}, [form, user]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError('');
		try {
			if (!firebaseUser) {
				throw new Error('Usuario no autenticado');
			}
			const idToken = await firebaseUser.getIdToken();
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
			setToastMessage('¡Cambios guardados correctamente!');
			setShowToast(true);
			setTimeout(() => setShowToast(false), 2500);
		} catch (err: any) {
			setError(err.message);
			setSaving(false);
		}
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!firebaseUser) return;
		
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setError('Las contraseñas nuevas no coinciden');
			return;
		}
		
		if (passwordForm.newPassword.length < 6) {
			setError('La nueva contraseña debe tener al menos 6 caracteres');
			return;
		}
		
		setChangingPassword(true);
		setError('');
		
		try {
			const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
			const credential = EmailAuthProvider.credential(
				firebaseUser.email!,
				passwordForm.currentPassword
			);
			await reauthenticateWithCredential(firebaseUser, credential);
			
			const idToken = await firebaseUser.getIdToken(true);
			
			const res = await fetch(ENDPOINT_CHANGE_PASSWORD, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword,
				}),
			});
			
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'No se pudo cambiar la contraseña');
			}
			
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setShowPasswordForm(false);
			setToastMessage('¡Contraseña actualizada correctamente!');
			setShowToast(true);
			setError('');
			setTimeout(() => setShowToast(false), 2500);
		} catch (err: any) {
			if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
				setError('La contraseña actual es incorrecta');
			} else {
				setError(err.message || 'Error al cambiar la contraseña');
			}
		} finally {
			setChangingPassword(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!firebaseUser) return;
		const ok = window.confirm('¿Estás seguro? Esta acción eliminará tu cuenta permanentemente.');
		if (!ok) return;
		setDeleting(true);
		setError('');
		try {
			const idToken = await firebaseUser.getIdToken();
			const res = await fetch(ENDPOINT_DELETE, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${idToken}`,
					'Content-Type': 'application/json',
				},
			});
			if (!res.ok) throw new Error('No se pudo eliminar la cuenta');
			await auth.signOut();
			localStorage.clear();
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Error al eliminar la cuenta');
		} finally {
			setDeleting(false);
		}
	};

	if (!firebaseUser) {
		return null;
	}

	return (
		<div className="edit-profile-page">
			<div className="edit-profile-wrapper">
				<div className="edit-profile-image">
					<img src="/registerImage.avif" alt="Edit profile" />
				</div>

				<div className="edit-profile-card">
					<div className="edit-profile-header">
						<img src="/logoInteractify.jpeg" alt="Interactify logo" className="edit-profile-logo" />
						<h1>Editar Perfil</h1>
					</div>

					<p className="edit-profile-subtitle">
						Actualiza tu información personal
					</p>

					{loading ? (
						<div className="edit-profile-loader">
							<div className="edit-spinner"></div>
							<p>Cargando perfil...</p>
						</div>
					) : error ? (
						<div className="edit-profile-error">
							<span className="edit-error-icon">⚠️</span>
							{error}
						</div>
					) : (
						<>
							{/* Formulario principal */}
							<form className="edit-profile-form" onSubmit={handleSave}>
								<div className="edit-profile-row">
									<div className="edit-input-group">
										<label htmlFor="firstName" className="edit-label">Nombre</label>
										<input
											id="firstName"
											name="firstName"
											type="text"
											value={form.firstName}
											onChange={handleChange}
											placeholder="Juan"
											className="edit-input"
											required
										/>
									</div>

									<div className="edit-input-group">
										<label htmlFor="lastName" className="edit-label">Apellido</label>
										<input
											id="lastName"
											name="lastName"
											type="text"
											value={form.lastName}
											onChange={handleChange}
											placeholder="Pérez"
											className="edit-input"
											required
										/>
									</div>
								</div>

								<div className="edit-input-group">
									<label htmlFor="email" className="edit-label">Correo electrónico</label>
									<input
										id="email"
										name="email"
										type="email"
										value={form.email}
										placeholder="tu@email.com"
										className="edit-input edit-input--disabled"
										disabled
									/>
									<span className="edit-helper-text">El correo no puede ser modificado</span>
								</div>

								<button 
									className="edit-btn edit-btn--primary" 
									type="submit" 
									disabled={!changed || saving}
								>
									{saving ? (
										<>
											<span className="edit-spinner-small"></span>
											Guardando...
										</>
									) : (
										'Guardar cambios'
									)}
								</button>
							</form>

							{/* Sección de cambio de contraseña */}
							<div className="edit-password-section">
								<div className="edit-section-header">
									<h3>Seguridad</h3>
									<p>Gestiona la contraseña de tu cuenta</p>
								</div>

								{!showPasswordForm ? (
									<button
										className="edit-btn edit-btn--secondary"
										type="button"
										onClick={() => setShowPasswordForm(true)}
									>
										Cambiar contraseña
									</button>
								) : (
									<form className="edit-password-form" onSubmit={handleChangePassword}>
										<div className="edit-input-group">
											<label htmlFor="currentPassword" className="edit-label">Contraseña actual</label>
											<input
												id="currentPassword"
												name="currentPassword"
												type="password"
												value={passwordForm.currentPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												className="edit-input"
												required
											/>
										</div>

										<div className="edit-input-group">
											<label htmlFor="newPassword" className="edit-label">Nueva contraseña</label>
											<input
												id="newPassword"
												name="newPassword"
												type="password"
												value={passwordForm.newPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												className="edit-input"
												required
											/>
										</div>

										<div className="edit-input-group">
											<label htmlFor="confirmPassword" className="edit-label">Confirmar nueva contraseña</label>
											<input
												id="confirmPassword"
												name="confirmPassword"
												type="password"
												value={passwordForm.confirmPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												className="edit-input"
												required
											/>
										</div>

										<div className="edit-button-group">
											<button
												className="edit-btn edit-btn--primary"
												type="submit"
												disabled={changingPassword}
											>
												{changingPassword ? (
													<>
														<span className="edit-spinner-small"></span>
														Cambiando...
													</>
												) : (
													'Confirmar cambio'
												)}
											</button>
											<button
												className="edit-btn edit-btn--ghost"
												type="button"
												onClick={() => {
													setShowPasswordForm(false);
													setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
													setError('');
												}}
											>
												Cancelar
											</button>
										</div>
									</form>
								)}
							</div>

							{/* Zona de peligro */}
							<div className="edit-danger-zone">
								<div className="edit-section-header">
									<h3>Zona de peligro</h3>
									<p>Eliminar tu cuenta es permanente e irreversible</p>
								</div>

								<button
									className="edit-btn edit-btn--danger"
									type="button"
									onClick={handleDeleteAccount}
									disabled={deleting}
								>
									{deleting ? (
										<>
											<span className="edit-spinner-small"></span>
											Eliminando cuenta...
										</>
									) : (
										'Eliminar cuenta permanentemente'
									)}
								</button>
							</div>
						</>
					)}

					{showToast && (
						<Toast message={toastMessage} type="success" />
					)}
				</div>
			</div>
		</div>
	);
};

export default EditProfile;