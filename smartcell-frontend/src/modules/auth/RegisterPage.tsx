import { RegisterForm } from './components/RegisterForm';
import { AuthShell } from './components/AuthShell';

export function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle={
        <>
          Crea un usuario nuevo desde aquí. Solo un administrador puede acceder a esta pantalla.
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
