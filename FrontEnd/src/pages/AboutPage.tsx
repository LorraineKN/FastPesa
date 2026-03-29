import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Zap, Users, ArrowRight, Globe, Heart, Target } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import teamNairobi from '@/assets/team-nairobi.jpg';
import heroStudents from '@/assets/hero-students.jpg';

const AboutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
                About <span className="text-primary">InstantAid Pay</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                InstantAid Pay is Kenya's modern digital wallet platform, designed to make sending, receiving, and managing money simple, fast, and secure. Built for students, small businesses, and everyday Kenyans.
              </p>
              <p className="text-muted-foreground">
                Our platform simulates the full M-Pesa experience with wallet-to-wallet transfers, Paybill payments, Buy Goods transactions, and real-time confirmation messages — all within a secure demo environment.
              </p>
            </div>
            <div>
              <img
                src={teamNairobi}
                alt="Young Kenyan professionals in a modern Nairobi coworking space"
                className="rounded-2xl shadow-lg w-full object-cover aspect-[16/9]"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Target, title: 'Our Mission', desc: 'To empower Kenyan students and small businesses with accessible, intuitive digital financial tools that mirror real-world M-Pesa workflows.' },
            { icon: Heart, title: 'Our Values', desc: 'Transparency, security, and inclusivity. Every transaction is tracked with unique Ref IDs and M-Pesa style confirmations.' },
            { icon: Globe, title: 'Our Vision', desc: 'A Kenya where every student and entrepreneur can manage their finances digitally with confidence, starting from campus.' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2 text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src={heroStudents}
              alt="Kenyan students using mobile payments"
              className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
              loading="lazy"
              width={1280}
              height={960}
            />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">Why InstantAid Pay?</h2>
            <div className="space-y-4">
              {[
                { icon: Zap, title: 'Instant Transfers', desc: 'Send money between wallets in real-time using just a Wallet ID — no phone or email required.' },
                { icon: Shield, title: 'Bank-Grade Security', desc: 'All transactions are encrypted and audited with unique reference IDs for your safety.' },
                { icon: Users, title: 'Built for Kenya', desc: 'M-Pesa style confirmations, KES currency, Paybill, Buy Goods, and Send Money flows.' },
                { icon: Wallet, title: 'Demo Mode', desc: 'Try all features with KES 10,000 demo balance — no real money needed. Perfect for learning.' },
              ].map(f => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="rounded-3xl gradient-hero p-8 lg:p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-primary-foreground mb-4">
            Ready to experience digital finance?
          </h2>
          <p className="text-primary-foreground/70 mb-6 max-w-md mx-auto">
            Create your free account and get KES 10,000 demo balance to explore all features.
          </p>
          <Button variant="accent" size="lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
            {user ? 'Go to Dashboard' : 'Create Free Account'} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
