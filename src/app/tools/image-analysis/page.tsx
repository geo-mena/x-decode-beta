import PageContainer from '@/components/layout/page-container';
import ImageAnalysis from '@/features/image-analysis';

export const metadata = {
    title: 'TOOLS - Image Analysis'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <ImageAnalysis />
            </div>
        </PageContainer>
    );
}
