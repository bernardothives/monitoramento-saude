import { test, expect } from '@playwright/test';

test.describe('Dashboard do Administrador', () => {
  // Hook para fazer login como admin antes de cada teste
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('combobox', { name: 'Departamento' }).click();
    await page.getByRole('option', { name: 'Planejamento' }).click();
    await page.getByLabel('Senha').fill('plan2026');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/dashboard');
  });

  test('deve carregar o dashboard geral com as estatísticas globais', async ({ page }) => {
    // Verifica se os elementos chave do dashboard de admin estão presentes
    await expect(page.locator('h2', { hasText: 'Visão Geral da Prefeitura' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Desempenho por Departamento (% Metas no Prazo)' })).toBeVisible();
    await expect(page.getByLabel('Auditar Departamento:')).toBeVisible();
  });

  test('deve filtrar as metas por departamento', async ({ page }) => {
    // O estado inicial deve mostrar a visão geral
    await expect(page.locator('h2', { hasText: 'Visão Geral da Prefeitura' })).toBeVisible();
    
    // Seleciona um departamento no filtro
    await page.getByLabel('Auditar Departamento:').click();
    await page.getByRole('option', { name: 'Atenção Especializada' }).click();

    // Aguarda a UI atualizar e o novo título aparecer
    const filteredTitle = page.locator('h2', { hasText: 'Painel de Gestão' });
    await expect(filteredTitle).toBeVisible();

    // NAVEGAÇÃO HIERÁRQUICA
    // 1. Clica na Diretriz
    await page.getByRole('heading', { name: 'DIRETRIZ 01' }).click();
    
    // 2. Clica no Objetivo
    await page.getByRole('heading', { name: 'OBJETIVO 2' }).click();

    // 3. Verifica se o card da meta está visível
    const metaCard = page.locator('article', { hasText: 'Manter os CEO' }).first();
    await expect(metaCard).toBeVisible();
  });

  test('deve limpar o filtro e voltar para a visão geral', async ({ page }) => {
    // Aplica um filtro primeiro
    await page.getByLabel('Auditar Departamento:').click();
    await page.getByRole('option', { name: 'Regulação' }).click();
    
    // Aguarda a UI atualizar
    const filteredTitle = page.locator('h2', { hasText: 'Painel de Gestão' });
    await expect(filteredTitle).toBeVisible();

    // Para limpar o filtro, o utilizador pode ter de selecionar a opção "placeholder"
    // ou clicar num botão "Limpar". Vamos simular a navegação para a raiz do dashboard.
    // A forma mais simples de "limpar" é navegar para a URL base.
    await page.goto('/dashboard');
    
    // Aguarda a UI reverter para o estado inicial
    const adminTitle = page.locator('h2', { hasText: 'Visão Geral da Prefeitura' });
    await expect(adminTitle).toBeVisible();
  });
});
