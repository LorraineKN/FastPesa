import React from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <section className="container py-16 max-w-3xl prose prose-sm dark:prose-invert flex-1">
        <h1 className="text-3xl font-display font-bold text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <h2 className="text-foreground">1. Acceptance</h2>
        <p className="text-muted-foreground">By using FastPesa, you agree to these terms. This is a demo platform for educational and demonstration purposes.</p>
        <h2 className="text-foreground">2. Demo Mode</h2>
        <p className="text-muted-foreground">All transactions on this platform use demo funds. No real money is transferred. KES 10,000 is credited to each new account for testing purposes.</p>
        <h2 className="text-foreground">3. User Responsibilities</h2>
        <p className="text-muted-foreground">Users are responsible for maintaining the security of their login credentials.</p>
        <h2 className="text-foreground">4. Limitation of Liability</h2>
        <p className="text-muted-foreground">FastPesa is provided "as is" without warranties. We are not liable for any losses incurred during demo use.</p>
        <h2 className="text-foreground">5. Contact</h2>
        <p className="text-muted-foreground">For questions, reach out at support@fastpesa.co.ke</p>
      </section>
      <PublicFooter />
    </div>
  );
};

export default TermsPage;
