import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import '../components/Toast.css';
import { useNavigate } from 'react-router-dom';

import type { User } from 'firebase/auth';
import '../styles/EditProfile.css';
import { auth } from '../config/firebase';

/**
 * API base URL for backend requests.
 */
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

/**
 * EditProfile component for Interactify.
 * Allows authenticated users to view and update their profile information.
 * Handles profile fetch, update, and account deletion.
 * @returns {JSX.Element} Profile edit form and controls.
 */
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

	/**
	 * Handles input changes for the profile form.
	 * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
	 */
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	/**
	 * Handles saving updated profile information.
	 * @param {React.FormEvent} e - Form submit event.
	 */
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
			// Reautenticar con Firebase para validar contraseña actual
			const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
			const credential = EmailAuthProvider.credential(
				firebaseUser.email!,
				passwordForm.currentPassword
			);
			await reauthenticateWithCredential(firebaseUser, credential);
			
			// Obtener token fresco después de reautenticar
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
			// Sign out locally and clear storage
			await auth.signOut();
			localStorage.clear();
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Error al eliminar la cuenta');
		} finally {
			setDeleting(false);
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
			// Reautenticar con Firebase para validar contraseña actual
			const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
			const credential = EmailAuthProvider.credential(
				firebaseUser.email!,
				passwordForm.currentPassword
			);
			await reauthenticateWithCredential(firebaseUser, credential);
			
			// Obtener token fresco después de reautenticar
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
			// Sign out locally and clear storage
			await auth.signOut();
			localStorage.clear();
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Error al eliminar la cuenta');
		} finally {
			setDeleting(false);
		}
	};

<<<<<<< Updated upstream
=======
	/**
	 * Handles account deletion for the authenticated user.
	 */
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
			/**
			 * Sign out locally and clear local storage.
			 */
			await auth.signOut();
			localStorage.clear();
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'Error al eliminar la cuenta');
		} finally {
			setDeleting(false);
		}
	};

>>>>>>> Stashed changes
	if (!firebaseUser) {
		return null;
	}

	return (
		<div className="edit-profile-page">
			<div className="edit-profile-wrapper">
				<div className="auth-image" aria-hidden="true">
					<img src={'/registerImage.avif'} alt="Edit profile" />
				</div>
				<div className="edit-profile-card">
					<div className="auth-header">
						<img src={'/logoInteractify.jpeg'} alt="logo" className="auth-logo" />
						<h1>Editar perfil</h1>
					</div>
					{/* Quitar imagen pequeña adicional para no duplicar y evitar cortes en responsive */}
					<p className="lead">Modifica tus datos personales</p>
					{loading ? (
						<p>Cargando…</p>
					) : error ? (
						<p style={{ color: 'red' }}>{error}</p>
					) : (
						<>
							<form className="edit-profile-form" onSubmit={handleSave}>
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
								<button className="edit-profile-btn" type="submit" disabled={!changed || saving}>
									{saving ? 'Guardando…' : 'Guardar cambios'}
								</button>
							</form>
							
						{/* Password Change Section */}
						<div className="password-section">
							{!showPasswordForm ? (
								<button
									className="edit-profile-btn"
									type="button"
									onClick={() => setShowPasswordForm(true)}
									style={{ background: '#5c6bc0' }}
								>
									Cambiar contraseña
								</button>
							) : (
								<form className="password-form" onSubmit={handleChangePassword}>
										<div className="input-row">
											<label>
												<span className="sr-only">Contraseña actual</span>
												<input
													name="currentPassword"
													type="password"
													value={passwordForm.currentPassword}
													onChange={handlePasswordChange}
													placeholder="Contraseña actual"
													required
												/>
											</label>
										</div>
										<div className="input-row">
											<label>
												<span className="sr-only">Nueva contraseña</span>
												<input
													name="newPassword"
													type="password"
													value={passwordForm.newPassword}
													onChange={handlePasswordChange}
													placeholder="Nueva contraseña"
													required
												/>
											</label>
										</div>
										<div className="input-row">
											<label>
												<span className="sr-only">Confirmar nueva contraseña</span>
												<input
													name="confirmPassword"
													type="password"
													value={passwordForm.confirmPassword}
													onChange={handlePasswordChange}
													placeholder="Confirmar nueva contraseña"
													required
												/>
											</label>
										</div>
										<div className="button-group">
											<button
												className="edit-profile-btn"
												type="submit"
												disabled={changingPassword}
												style={{ flex: 1 }}
											>
												{changingPassword ? 'Cambiando…' : 'Confirmar'}
											</button>
											<button
												className="edit-profile-btn"
												type="button"
												onClick={() => {
													setShowPasswordForm(false);
													setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
													setError('');
												}}
												style={{ flex: 1, background: '#666' }}
											>
												Cancelar
											</button>
										</div>
									</form>
								)}
							</div>
							
							<button
								className="edit-profile-delete"
								type="button"
								onClick={handleDeleteAccount}
								disabled={deleting}
								style={{ background: '#ff4d4f', color: '#fff', marginTop: 20 }}
							>
								{deleting ? 'Eliminando…' : 'Eliminar cuenta'}
							</button>
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
