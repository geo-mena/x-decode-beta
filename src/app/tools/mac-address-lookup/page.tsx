import PageContainer from '@/components/layout/page-container';
import MacAddressLookup from '@/features/mac-address-lookup';

export const metadata = {
    title: 'NETWORK - MAC Address Lookup',
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <MacAddressLookup />
            </div>
        </PageContainer>
    );
}
