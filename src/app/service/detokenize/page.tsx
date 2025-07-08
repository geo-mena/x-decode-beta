import PageContainer from '@/components/layout/page-container';
import Detokenize from '@/features/detokenize';

export const metadata = {
    title: 'IDAPI - Detokenizar Imagen'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='flex flex-1 flex-col space-y-4'>
                <Detokenize />
            </div>
        </PageContainer>
    );
}
