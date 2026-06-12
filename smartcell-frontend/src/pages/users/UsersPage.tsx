import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createUser, deleteUser, fetchUsers, updateUser } from '../../api/userService';

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', is_admin: false, is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ userId: 0, userName: '', password: '', password_confirmation: '' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError('No tienes permiso para ver este módulo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  if (!user?.is_admin) {
    return <div className="p-6 text-red-600">Solo el administrador puede acceder a este módulo.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(form);
      await loadUsers();
      setForm({ name: '', email: '', password: '', password_confirmation: '', is_admin: false, is_active: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear el usuario.');
    }
  };

  const toggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      setError('');
      await updateUser(userId, { is_active: !currentStatus });
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  const openPasswordModal = (userId: number, name: string) => {
    setError('');
    setPasswordForm({ userId, userName: name, password: '', password_confirmation: '' });
    setPasswordModalOpen(true);
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordForm.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await updateUser(passwordForm.userId, {
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });
      setPasswordModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <section className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-600">Panel exclusivo del administrador para crear usuarios y cambiar su estado activo o inactivo.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Crear usuario</h2>
            <p className="text-sm text-slate-500">Completa los datos básicos y define si será administrador o estará activo desde el inicio.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Nuevo</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Nombre completo</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Ej. Ana Gómez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Correo electrónico</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="usuario@empresa.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Contraseña</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Mínimo 8 caracteres" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Confirmar contraseña</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" placeholder="Repite la contraseña" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} />
            Marcar como administrador
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Activar usuario al crearlo
          </label>
        </div>

        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-5 flex items-center justify-end">
          <button className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700" type="submit">Crear usuario</button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
          <p className="text-sm text-slate-500">Puedes activar, desactivar o cambiar la contraseña de cualquier usuario desde aquí.</p>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-500">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{u.is_admin ? 'Administrador' : 'Usuario'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          onClick={() => void toggleStatus(u.id, Boolean(u.is_active))}
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          onClick={() => openPasswordModal(u.id, u.name)}
                        >
                          Contraseña
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          onClick={() => void deleteUser(u.id).then(loadUsers)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {passwordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h3>
                <p className="text-sm text-slate-500">Actualiza la clave de acceso para {passwordForm.userName}.</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                onClick={() => setPasswordModalOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={submitPasswordChange} className="space-y-4">
              <label className="block space-y-1 text-sm text-slate-700">
                <span className="font-medium">Nueva contraseña</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  required
                />
              </label>

              <label className="block space-y-1 text-sm text-slate-700">
                <span className="font-medium">Confirmar contraseña</span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  required
                />
              </label>

              {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  Guardar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
