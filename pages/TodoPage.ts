import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the TodoMVC demo app.
 * All interactions with the page go through here, so the tests read
 * like a description of behaviour rather than a list of selectors.
 */
export class TodoPage {
  readonly page: Page;
  readonly newTodoInput: Locator;
  readonly todoItems: Locator;
  readonly todoTitles: Locator;
  readonly todoCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.getByTestId('todo-item');
    this.todoTitles = page.getByTestId('todo-title');
    this.todoCount = page.locator('.todo-count');
  }

  async goto() {
    // Relative to baseURL; a leading '/' would jump to the domain root (404).
    await this.page.goto('./');
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  async addTodos(texts: string[]) {
    for (const text of texts) {
      await this.addTodo(text);
    }
  }

  /** Toggle the completed state of a todo by its visible text. */
  async toggle(text: string) {
    await this.todoItems
      .filter({ hasText: text })
      .getByRole('checkbox')
      .click();
  }

  /** Delete a todo by hovering it and clicking its destroy button. */
  async remove(text: string) {
    const item = this.todoItems.filter({ hasText: text });
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async filterBy(name: 'All' | 'Active' | 'Completed') {
    await this.page.getByRole('link', { name }).click();
  }

  async expectTitles(titles: string[]) {
    await expect(this.todoTitles).toHaveText(titles);
  }

  async expectCount(n: number) {
    await expect(this.todoItems).toHaveCount(n);
  }
}
