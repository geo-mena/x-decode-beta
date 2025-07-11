import PageContainer from '@/components/layout/page-container';
import DecodeImage from '@/features/decode-image';

export const metadata = {
    title: 'TOOLS - Base64 a Imagen'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <DecodeImage />
            </div>
        </PageContainer>
    );
}
