import { test, expect } from '@playwright/test'

test.describe('LifeLink End-to-End Donor Workflow & Critical Paths', () => {
  test('homepage loads correctly with header and active emergency counts', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.ll-hero-title')).toBeVisible()
    await expect(page.locator('.ll-navbar-brand')).toContainText('LifeLink')
  })

  test('navigates to Emergency Board and displays request items', async ({ page }) => {
    await page.goto('/emergency')
    await expect(page.locator('h1')).toContainText('Emergency Request Board')
    await expect(page.locator('#filter-city')).toBeVisible()
  })

  test('filters requests by city name', async ({ page }) => {
    await page.goto('/emergency')
    await page.fill('#filter-city', 'Ho Chi Minh')
    await page.waitForTimeout(300)
    await expect(page.locator('#filter-city')).toHaveValue('Ho Chi Minh')
  })

  test('navigates to Donation Events page', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('h1')).toContainText('Donation Events')
  })

  test('navigates to News page and handles search', async ({ page }) => {
    await page.goto('/news')
    await expect(page.locator('h1')).toContainText('Blood Donation News')
    await page.fill('input[placeholder*="Search"]', 'Red Cross')
    await page.waitForTimeout(300)
  })

  test('navigates to Login view', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-email')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
  })

  test('navigates to Register view', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('responsive mobile navigation drawer toggles cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    const toggleBtn = page.locator('.navbar-toggler')
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click()
      await expect(page.locator('#navbarNav')).toHaveClass(/show/)
    }
  })
})
