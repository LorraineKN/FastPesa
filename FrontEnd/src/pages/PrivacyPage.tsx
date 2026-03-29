import React from 'react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <section className="container py-16 max-w-3xl prose prose-sm dark:prose-invert flex-1">
        <h1 className="text-3xl font-display font-bold text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 2026</p>
        <h2 className="text-foreground">1. Data Collection</h2>
        <p className="text-muted-foreground">We collect your name, email address, and transaction data to provide our demo wallet services.</p>
        <h2 className="text-foreground">2. Data Usage</h2>
        <p className="text-muted-foreground">Your data is used solely for platform functionality. We do not sell or share personal data with third parties.</p>
        <h2 className="text-foreground">3. Security</h2>
        <p className="text-muted-foreground">All data is encrypted in transit and at rest. We follow industry best practices for data protection.</p>
        <h2 className="text-foreground">4. Data Retention</h2>
        <p className="text-muted-foreground">Demo account data may be periodically cleared. This is a demonstration platform.</p>
        <h2 className="text-foreground">5. Contact</h2>
        <p className="text-muted-foreground">For privacy concerns, email privacy@instantaidpay.co.ke</p>
      </section>
      <PublicFooter />
    </div>
  );
};

export default PrivacyPage;
