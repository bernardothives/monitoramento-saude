import { getDepartments } from '@/app/actions';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const departments = await getDepartments();
  return <LoginForm departments={departments} />;
}
