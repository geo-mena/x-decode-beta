import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  // Temporarily bypassing authentication for development
  // const { userId } = await auth();

  // if (!userId) {
  //   return redirect('/auth/sign-in');
  // } else {
  //   redirect('/dashboard/overview');
  // }
  
  // Direct redirect to dashboard
  redirect('/dashboard/overview');
}
