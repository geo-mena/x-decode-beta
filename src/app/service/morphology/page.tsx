import PageContainer from '@/components/layout/page-container';
import DocumentValidation from '@/features/document-validation';

export const metadata = {
    title: 'IDAPI - Morfología'
};

export default function page() {
    return (
        <PageContainer scrollable={true}>
            <div className='mb-4 flex flex-1 flex-col space-y-4'>
                <DocumentValidation />
            </div>
        </PageContainer>
    );
}
