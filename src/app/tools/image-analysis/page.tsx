import PageContainer from '@/components/layout/page-container';
import ImageAnalysis from '@/features/image-analysis';

export const metadata = {
    title: 'TOOLS - Análisis de Imágenes'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='flex flex-1 flex-col space-y-4 mb-4'>
                <ImageAnalysis />
            </div>
        </PageContainer>
    );
}
