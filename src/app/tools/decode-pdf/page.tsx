import PageContainer from '@/components/layout/page-container';
import DecodePdf from '@/features/decode-pdf';

export const metadata = {
    title: 'TOOLS - Base64 a PDF'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <DecodePdf />
            </div>
        </PageContainer>
    );
}
