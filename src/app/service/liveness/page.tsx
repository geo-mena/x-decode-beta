import PageContainer from '@/components/layout/page-container';
import LivenessContent from '@/features/liveness';

export const metadata = {
    title: 'IDAPI - Prueba de Vida'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <LivenessContent />
            </div>
        </PageContainer>
    );
}
