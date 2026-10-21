import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

test.describe('TodoMVC — core flows', () => {
  let todo: TodoPage;

  test.beforeEach(async ({ page }) => {
    todo = new TodoPage(page);
    await todo.goto();
  });

  test('adds new todos to the list', async () => {
    await todo.addTodos(['Buy milk', 'Walk the dog']);
    await todo.expectTitles(['Buy milk', 'Walk the dog']);
    await todo.expectCount(2);
  });

  test('marks a todo as completed', async ({ page }) => {
    await todo.addTodo('Write tests');
    await todo.toggle('Write tests');
    await expect(todo.todoItems.filter({ hasText: 'Write tests' }))
      .toHaveClass(/completed/);
  });

  test('deletes a todo', async () => {
    await todo.addTodos(['Task A', 'Task B']);
    await todo.remove('Task A');
    await todo.expectTitles(['Task B']);
    await todo.expectCount(1);
  });

  test('filters active and completed todos', async () => {
    await todo.addTodos(['Active task', 'Done task']);
    await todo.toggle('Done task');

    await todo.filterBy('Active');
    await todo.expectTitles(['Active task']);

    await todo.filterBy('Completed');
    await todo.expectTitles(['Done task']);

    await todo.filterBy('All');
    await todo.expectCount(2);
  });
});
