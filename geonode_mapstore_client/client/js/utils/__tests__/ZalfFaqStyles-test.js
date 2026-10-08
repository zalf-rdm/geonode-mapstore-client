import expect from 'expect';
import stylesheet from '!!raw-loader!../../../themes/zalf/components/faq/faqpage.css';

describe('ZALF FAQ institutional page styles', () => {
    it('uses the shared public-page hero treatment', () => {
        expect(stylesheet).toContain("url('../../../../../static/img/bg_dataset_landing_topo.png')");
        expect(stylesheet).toContain('width: min(960px, 100%)');
        expect(stylesheet).toContain('font-size: clamp(2rem, 4vw, 3rem)');
    });
});
