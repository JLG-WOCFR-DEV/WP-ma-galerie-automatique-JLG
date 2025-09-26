import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import { expect, test } from '@wordpress/e2e-test-utils-playwright';

const PLACEHOLDER_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6XgnkAAAAASUVORK5CYII=';

type PreparedImages = {
    files: string[];
    cleanup: () => Promise<void>;
};

async function createTemporaryImages(fileNames: string[]): Promise<{
    directory: string;
    files: string[];
    cleanup: () => Promise<void>;
}> {
    const directory = path.join(os.tmpdir(), `mga-e2e-${crypto.randomUUID()}`);
    await fs.mkdir(directory, { recursive: true });

    const files: string[] = [];

    for (const fileName of fileNames) {
        const filePath = path.join(directory, fileName);
        await fs.writeFile(filePath, Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64'));
        files.push(filePath);
    }

    const cleanup = async () => {
        await Promise.all(
            files.map(async (file) => {
                try {
                    await fs.unlink(file);
                } catch (error) {
                    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                        throw error;
                    }
                }
            }),
        );

        await fs.rm(directory, { recursive: true, force: true });
    };

    return { directory, files, cleanup };
}

function buildGalleryContent(mediaItems: Array<{ id: number; source_url: string }>): string {
    return mediaItems
        .map((media, index) => {
            const altText = `Placeholder ${index + 1}`;

            return `<!-- wp:image {"id":${media.id},"sizeSlug":"full","linkDestination":"media"} -->\n` +
                `<figure class="wp-block-image size-full"><a href="${media.source_url}">` +
                `<img src="${media.source_url}" alt="${altText}" class="wp-image-${media.id}" /></a></figure>\n` +
                `<!-- /wp:image -->`;
        })
        .join('\n');
}

async function prepareGalleryImages(): Promise<PreparedImages> {
    const assetsDir = path.resolve(process.cwd(), 'tests/e2e/assets');

    try {
        const entries = await fs.readdir(assetsDir);
        const imageFiles = entries
            .filter((fileName) => /\.(png|jpe?g|gif|webp|avif)$/i.test(fileName))
            .sort();

        if (imageFiles.length >= 2) {
            return {
                files: imageFiles.map((fileName) => path.join(assetsDir, fileName)),
                cleanup: async () => {},
            };
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }

    const placeholders = await createTemporaryImages(['placeholder-1.png', 'placeholder-2.png']);

    return {
        files: placeholders.files,
        cleanup: placeholders.cleanup,
    };
}

test.describe('Gallery viewer', () => {
    test.beforeAll(async ({ requestUtils }) => {
        await requestUtils.login();
        await requestUtils.activatePlugin('ma-galerie-automatique/ma-galerie-automatique.php');
        await requestUtils.deleteAllPosts();
        await requestUtils.deleteAllMedia();
    });

    test.afterAll(async ({ requestUtils }) => {
        await requestUtils.deleteAllPosts();
        await requestUtils.deleteAllMedia();
    });

    test('opens the viewer for a seeded gallery post', async ({ page, requestUtils }) => {
        const preparedImages = await prepareGalleryImages();

        const uploads: Array<{ id: number; source_url: string }> = [];

        try {
            for (const filePath of preparedImages.files) {
                const media = await requestUtils.uploadMedia(filePath);
                uploads.push({ id: media.id, source_url: media.source_url });
            }

            const content = buildGalleryContent(uploads);
            const now = new Date().toISOString();
            const post = await requestUtils.createPost({
                title: 'Gallery viewer E2E',
                content,
                status: 'publish',
                date: now,
                date_gmt: now,
            });

            await page.goto(post.link);
            await expect(page.locator(`a[href="${uploads[0].source_url}"] img`)).toBeVisible();

            await page.locator(`a[href="${uploads[0].source_url}"]`).click();

            const viewer = page.locator('#mga-viewer');
            await expect(viewer).toBeVisible();
            await expect(page.locator('#mga-counter')).toHaveText(`1 / ${uploads.length}`);
        } finally {
            await preparedImages.cleanup();
        }
    });
});
