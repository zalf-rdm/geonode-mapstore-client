import expect from 'expect';
import {
    ensureCatalogueThumbnail,
    filterCatalogueMetadata,
    hasCatalogueMetadataValue
} from '../../../themes/zalf/utils/CatalogueUtils';

describe('ZALF catalogue utilities', () => {
    it('treats zero as a meaningful statistic', () => {
        expect(hasCatalogueMetadataValue({ views: 0 }, 'views')).toBe(true);
    });

    it('hides only metadata configured to disappear when empty', () => {
        const metadata = [
            { path: 'title' },
            { path: 'popular_count', hideIfEmpty: true },
            { path: 'download_count', hideIfEmpty: true },
            { path: 'group.title', hideIfEmpty: true }
        ];
        expect(filterCatalogueMetadata(metadata, {
            title: 'Dataset',
            popular_count: null,
            download_count: 0,
            group: { title: '' }
        })).toEqual([
            { path: 'title' },
            { path: 'download_count', hideIfEmpty: true }
        ]);
    });

    it('maps the API thumbnail into the resource card information', () => {
        expect(ensureCatalogueThumbnail({
            thumbnail_url: '/uploaded/thumb.jpg',
            '@extras': { info: { icon: { glyph: 'file' } } }
        })).toEqual({
            thumbnail_url: '/uploaded/thumb.jpg',
            '@extras': {
                info: {
                    icon: { glyph: 'file' },
                    thumbnailUrl: '/uploaded/thumb.jpg'
                }
            }
        });
    });
});
