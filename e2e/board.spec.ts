import { expect, test, type Browser, type Page } from '@playwright/test';

const ALICE = { userId: '11111111-1111-4111-8111-111111111111', name: 'Alice Falcon', color: '#EF476F' };
const BOB = { userId: '22222222-2222-4222-8222-222222222222', name: 'Bob Otter', color: '#118AB2' };

async function newUser(browser: Browser, identity: typeof ALICE): Promise<Page> {
  const context = await browser.newContext();
  await context.addInitScript((id) => localStorage.setItem('liveboard:identity', JSON.stringify(id)), identity);
  return context.newPage();
}

/** Alice creates a board at "/", Bob opens the same URL. */
async function twoUsersOnOneBoard(browser: Browser) {
  const a = await newUser(browser, ALICE);
  await a.goto('/');
  await a.waitForURL(/\/b\/[0-9a-f-]{36}$/);
  await expect(a.getByRole('button', { name: 'Column title' }).first()).toBeVisible();

  const b = await newUser(browser, BOB);
  await b.goto(a.url());
  await expect(b.getByRole('button', { name: 'Column title' }).first()).toBeVisible();
  return { a, b };
}

async function addCard(page: Page, title: string) {
  const input = page.getByRole('textbox', { name: 'Add a card' }).first();
  await input.fill(title);
  await input.press('Enter');
}

const cardButton = (page: Page, title: string) => page.getByRole('button', { name: new RegExp(`^${title}\\b`) });

test('a card added by one user appears for the other', async ({ browser }) => {
  const { a, b } = await twoUsersOnOneBoard(browser);
  await addCard(a, 'Write the e2e test');
  await expect(cardButton(a, 'Write the e2e test')).toBeVisible();
  await expect(cardButton(b, 'Write the e2e test')).toBeVisible();
});

test('presence chips show both users', async ({ browser }) => {
  const { a, b } = await twoUsersOnOneBoard(browser);
  for (const page of [a, b]) {
    await expect(page.getByTitle(/Alice Falcon/)).toBeVisible();
    await expect(page.getByTitle(/Bob Otter/)).toBeVisible();
  }
  await expect(a.getByTitle('Alice Falcon (you) — click to rename')).toBeVisible();
});

test('a drag by one user reorders the cards for the other', async ({ browser }) => {
  const { a, b } = await twoUsersOnOneBoard(browser);
  await addCard(a, 'Alpha');
  await addCard(a, 'Beta');
  await expect(cardButton(b, 'Beta')).toBeVisible();
  await expect(cardButton(b, 'Alpha')).toBeVisible();

  const order = (page: Page) => page.getByRole('button', { name: /^(Alpha|Beta)\b/ });
  await expect(order(b)).toHaveText([/^Alpha/, /^Beta/]);

  // Drag Beta above Alpha with the pointer (dnd-kit needs real movement past its 4px activation distance).
  const beta = await cardButton(a, 'Beta').boundingBox();
  const alpha = await cardButton(a, 'Alpha').boundingBox();
  if (!beta || !alpha) throw new Error('cards not laid out');
  await a.mouse.move(beta.x + beta.width / 2, beta.y + beta.height / 2);
  await a.mouse.down();
  await a.mouse.move(beta.x + beta.width / 2, beta.y + beta.height / 2 - 10, { steps: 5 });
  await a.mouse.move(alpha.x + alpha.width / 2, alpha.y + 2, { steps: 15 });
  await a.mouse.up();

  await expect(order(a)).toHaveText([/^Beta/, /^Alpha/]);
  await expect(order(b)).toHaveText([/^Beta/, /^Alpha/]);
});

test("a cursor moved by one user is shown to the other with their name", async ({ browser }) => {
  const { a, b } = await twoUsersOnOneBoard(browser);
  await expect(b.getByTitle(/Alice Falcon/)).toBeVisible(); // presence must be in sync: cursors are filtered by it

  // Cursor events are throttled and broadcast-only, so keep moving until the other side renders it.
  await expect(async () => {
    await a.mouse.move(300, 300);
    await a.mouse.move(420, 360, { steps: 5 });
    await expect(b.getByText('Alice Falcon', { exact: true })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
});
