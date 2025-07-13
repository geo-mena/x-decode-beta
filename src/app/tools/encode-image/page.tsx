import PageContainer from '@/components/layout/page-container';
import EncodeImage from '@/features/encode-image';

export const metadata = {
    title: 'TOOLS - Image to Base64'
};

export default function page() {
    return (
        <PageContainer scrollable={false}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <EncodeImage />
            </div>
        </PageContainer>
    );
}
