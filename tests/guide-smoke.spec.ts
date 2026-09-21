import { test, expect } from '@playwright/test';

test.describe('Maycha Contract User Guide Web - Smoke Tests', () => {
  test('tất cả 47 ảnh hướng dẫn render thành công (naturalWidth > 0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.screenshot-frame img', { timeout: 15000 });

    const images = page.locator('.screenshot-frame img');
    await expect(images).toHaveCount(47);

    // Ép eager load để trình duyệt tải toàn bộ ảnh không phụ thuộc vị trí cuộn
    await images.evaluateAll((nodes) => {
      nodes.forEach((n) => {
        (n as HTMLImageElement).loading = 'eager';
      });
    });

    // Chờ tất cả ảnh nạp xong
    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.screenshot-frame img'));
        return imgs.length === 47 && imgs.every((img) => img.complete);
      },
      undefined,
      { timeout: 30000 },
    );

    // Kiểm tra không có ảnh nào bị hỏng (naturalWidth === 0)
    const brokenImages = await images.evaluateAll((nodes) => {
      return nodes
        .map((n) => ({
          src: (n as HTMLImageElement).src,
          naturalWidth: (n as HTMLImageElement).naturalWidth,
          naturalHeight: (n as HTMLImageElement).naturalHeight,
        }))
        .filter((info) => info.naturalWidth === 0 || info.naturalHeight === 0);
    });

    expect(brokenImages).toEqual([]);
  });

  test('mục lục nhảy đúng anchor và không bị tràn ngang (horizontal overflow)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.sidebar-section-link', { timeout: 15000 });

    // Click vào một mục bất kỳ trên sidebar
    const targetLink = page.locator('a[href="#contract-list-console"]').first();
    await targetLink.waitFor({ state: 'visible' });
    await targetLink.click();

    await page.waitForTimeout(1200);

    // Kiểm tra hash cập nhật
    expect(page.url()).toContain('#contract-list-console');
    // Kiểm tra không bị tràn thanh cuộn ngang
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('lightbox phóng to ảnh hoạt động khi bấm vào ảnh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.screenshot-frame img', { timeout: 15000 });

    // Click vào ảnh đầu tiên
    const firstImage = page.locator('.screenshot-frame img').first();
    await firstImage.click({ force: true });
    // Chờ modal preview của Ant Design hiển thị
    const previewWrap = page.locator('.ant-image-preview-wrap');
    await expect(previewWrap).toBeVisible({ timeout: 8000 });

    // Đóng lightbox bằng phím Escape
    await page.keyboard.press('Escape');
    await expect(previewWrap).toBeHidden({ timeout: 5000 });
  });

  test('tìm kiếm hỗ trợ từ khóa trong bảng và hiển thị Empty khi không có kết quả', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.header-search input', { timeout: 15000 });

    const searchInput = page.locator('.header-search input').first();
    // Tìm từ khóa bình dân trong nội dung (ví dụ: "Mã quán")
    await searchInput.fill('Mã quán');
    await page.waitForTimeout(600);

    // Phải tìm thấy ít nhất 1 mục
    const visibleSections = page.locator('.guide-section');
    await expect(visibleSections).not.toHaveCount(0);

    // Tìm từ khóa vô nghĩa
    await searchInput.fill('XYZ_KHONG_TON_TAI_12345');
    await page.waitForTimeout(600);

    // Hiển thị component Empty
    const emptyState = page.locator('.guide-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('bộ lọc vai trò Kế toán giảm số section hiển thị', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.role-card', { timeout: 15000 });
    const totalBefore = await page.locator('.guide-section').count();
    await page.locator('.role-card').filter({ hasText: 'Kế toán' }).click();
    await page.waitForTimeout(600);
    const totalAfter = await page.locator('.guide-section').count();
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  test('tìm kiếm không dấu "mat coc" ra kết quả', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.header-search input', { timeout: 15000 });
    const searchInput = page.locator('.header-search input').first();
    await searchInput.fill('mat coc');
    await page.waitForTimeout(600);
    await expect(page.locator('.guide-empty-state')).not.toBeVisible();
  });

  test('tìm kiếm "Playbook" tìm thấy nội dung Chương 11', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.header-search input', { timeout: 15000 });
    const searchInput = page.locator('.header-search input').first();
    await searchInput.fill('Playbook');
    await page.waitForTimeout(600);
    await expect(page.locator('.guide-empty-state')).not.toBeVisible();
    await expect(page.locator('text=Chương 11').first()).toBeVisible();
  });

  test('nút Xuất file Word (.docx) hoạt động và tải xuống file docx thành công', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.export-word-btn', { timeout: 15000 });

    const exportBtn = page.locator('.export-word-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Xuất file Word (.docx)');

    // Chờ sự kiện download
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Maycha-Cam-Nang-Huong-Dan-Su-Dung-v2.0.docx');

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const fs = await import('fs');
    const stats = fs.statSync(downloadPath!);
    expect(stats.size).toBeGreaterThan(500000);
  });
});
