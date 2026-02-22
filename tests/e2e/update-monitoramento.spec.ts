import { test, expect } from '@playwright/test';

test.describe('Fluxo de Atualização de Monitoramento', () => {
  
  test.beforeEach(async ({ page }) => {
    // Loga como um departamento específico
    await page.goto('/login');
    await page.getByRole('combobox', { name: 'Departamento' }).click();
    await page.getByRole('option', { name: 'Atenção Primária' }).click();
    await page.getByLabel('Senha').fill('primaria');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/dashboard');
  });

  test('deve atualizar um monitoramento e refletir a mudança na UI', async ({ page }) => {
    // 0. Garantir que a página do dashboard do departamento carregou
    await expect(page.locator('h2', { hasText: 'Painel Departamental' })).toBeVisible();
    
    // NAVEGAÇÃO HIERÁRQUICA
    // 1. Clica na Diretriz
    await page.getByRole('heading', { name: 'DIRETRIZ 01' }).click();

    // 2. Clica no Objetivo
    await page.getByRole('heading', { name: 'OBJETIVO 1' }).click();

    // 3. Encontrar uma meta específica para atualizar
    const metaCard = page.locator('article', { hasText: 'Construir UBS' }).first();
    await expect(metaCard).toBeVisible();

    // 4. Abrir o modal de atualização
    await metaCard.getByRole('button', { name: 'Atualizar Monitoramento' }).click();
    
    // 5. Esperar o Sheet (modal) abrir e preencher o formulário
    const sheet = page.locator('[role="dialog"]', { hasText: 'Atualizar Monitoramento' });
    await expect(sheet).toBeVisible();

    const valorRealizado = '1';
    const justificativa = 'A nova UBS Forquilhinhas foi oficialmente inaugurada e está operacional.';
    
    await sheet.getByLabel('Período').selectOption({ label: '1º Quadrimestre' });
    await sheet.getByLabel('Valor').fill(valorRealizado);
    await sheet.getByLabel('Justificativa').fill(justificativa);

    // 6. Submeter o formulário
    const submitButton = sheet.getByRole('button', { name: 'Salvar Alterações' });
    await submitButton.click();

    // 7. Verificar o estado de "pending" (botão desabilitado e com texto de carregando)
    await expect(submitButton).toBeDisabled();
    await expect(sheet.locator('text=Salvando...')).toBeVisible();

    // 8. Verificar a mensagem de sucesso e o fechamento do modal
    await expect(sheet.locator('text=Monitoramento salvo com sucesso!')).toBeVisible({ timeout: 10000 }); // Ações no server podem demorar um pouco
    
    // O modal deve fechar automaticamente após a mensagem de sucesso
    await expect(sheet).not.toBeVisible({ timeout: 5000 });

    // 9. Verificar se a UI no card foi atualizada
    // O progresso deve ser 100% (valor 1 / meta 1)
    const progressBar = metaCard.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    // A justificativa deve estar visível
    const justificativaText = metaCard.locator('p', { hasText: `"${justificativa}"` });
    await expect(justificativaText).toBeVisible();
    
    // O status deve mudar para 'VERDE'
    const statusBadge = metaCard.locator('[class*="bg-green-500"]');
    await expect(statusBadge).toContainText('VERDE');
  });

});
