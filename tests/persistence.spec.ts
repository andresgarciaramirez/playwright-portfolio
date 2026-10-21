import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

test.describe('TodoMVC — persistence', () => {
  test('todos survive a page reload', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTodos(['Persisted item 1', 'Persisted item 2']);
    await todo.toggle('Persisted item 1');

    await page.reload();

    await todo.expectCount(2);
    await todo.expectTitles(['Persisted item 1', 'Persisted item 2']);
    await expect(todo.todoItems.filter({ hasText: 'Persisted item 1' }))
      .toHaveClass(/completed/);
    await expect(todo.todoItems.filter({ hasText: 'Persisted item 2' }))
      .not.toHaveClass(/completed/);
  });
});
