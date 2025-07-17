import PageContainer from '@/components/layout/page-container';
import MacAddressGenerator from '@/features/mac-address-generator';

export const metadata = {
    title: 'NETWORK - MAC Address Generator',
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <MacAddressGenerator />
            </div>
        </PageContainer>
    );
}
