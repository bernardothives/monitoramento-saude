import { getDepartments } from '@/app/actions';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const departments = await getDepartments();
  return <LoginForm departments={departments} />;
}
