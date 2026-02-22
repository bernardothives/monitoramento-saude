import { test, expect } from '@playwright/test';

test.describe('Autenticação e Redirecionamento', () => {
  test('deve falhar o login com credenciais incorretas', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('combobox', { name: 'Departamento' }).click();
    await page.getByRole('option', { name: 'Planejamento' }).click();
    await page.getByLabel('Senha').fill('senhaerrada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Espera por uma mensagem de erro aparecer na página
    const errorMessage = page.locator('text=Departamento ou senha incorretos.');
    await expect(errorMessage).toBeVisible();

    // Garante que não houve redirecionamento
    await expect(page).toHaveURL('/login');
  });

  test('deve logar como Admin e redirecionar para o dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Preenche o formulário de login
    await page.getByRole('combobox', { name: 'Departamento' }).click();
    await page.getByRole('option', { name: 'Planejamento' }).click();
    await page.getByLabel('Senha').fill('plan2026');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Espera pelo redirecionamento e verifica a URL
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');

    // Verifica se um elemento específico do dashboard de admin está visível
    const adminTitle = page.locator('h2', { hasText: 'Visão Geral da Prefeitura' });
    await expect(adminTitle).toBeVisible();
  });

  test('deve logar como Departamento e redirecionar para o dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Preenche o formulário de login
    await page.getByRole('combobox', { name: 'Departamento' }).click();
    await page.getByRole('option', { name: 'Atenção Primária' }).click();
    await page.getByLabel('Senha').fill('primaria');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Espera pelo redirecionamento e verifica a URL
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');

    // Verifica se o título do dashboard do departamento está correto
    const deptTitle = page.locator('h2', { hasText: 'Painel Departamental' });
    await expect(deptTitle).toBeVisible();
  });
});
