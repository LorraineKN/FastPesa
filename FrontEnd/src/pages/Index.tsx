import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Zap, ArrowRight, CreditCard, Send, QrCode } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import heroStudents from '@/assets/hero-students.jpg';
import marketBusiness from '@/assets/market-business.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: Send, title: 'Wallet Transfers', description: 'Send money instantly between FastPesa wallets using Wallet ID — no phone or email needed' },
    { icon: CreditCard, title: 'M-Pesa Integration', description: 'Paybill, Send Money, and Buy Goods — all simulated in demo mode' },
    { icon: QrCode, title: 'Payment Requests', description: 'Generate payment links and QR codes for your business' },
    { icon: Shield, title: 'Bank-Grade Security', description: 'Encrypted transactions with full audit trails' },
    { icon: Zap, title: 'Instant Processing', description: 'Real-time transaction processing and M-Pesa style notifications' },
    { icon: Wallet, title: 'Demo Wallet', description: 'Get KES 10,000 demo balance on signup to test all features' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Kenya's Digital Wallet Platform
              </div>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
                Your Money, <br />
                <span className="text-primary">Instantly</span> Available
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Send, receive, and manage your KES seamlessly. M-Pesa integration, wallet transfers, and business payments — all in one secure platform.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {user ? (
                  <Button variant="hero" size="lg" onClick={() => navigate('/dashboard')} className="text-base px-8">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button variant="hero" size="lg" onClick={() => navigate('/register')} className="text-base px-8">
                      Create Free Account
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate('/login')} className="text-base">
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img
                src={heroStudents}
                alt="Kenyan students using mobile payments on campus"
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                width={1280}
                height={960}
              />
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Instant Transfer</p>
                <p className="text-lg font-display font-bold text-primary">KES 5,000</p>
                <p className="text-xs text-accent">✓ Sent successfully</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Use Cases */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src={marketBusiness}
              alt="Kenyan market vendor accepting mobile payment from customer"
              className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
              loading="lazy"
              width={1280}
              height={960}
            />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Built for Kenyan Businesses
            </h2>
            <p className="text-muted-foreground mb-6">
              From market stalls to tech startups — accept payments via M-Pesa Paybill, Till Numbers, or wallet-to-wallet transfers. Generate QR codes and payment links instantly.
            </p>
            <ul className="space-y-3">
              {['Accept M-Pesa payments instantly', 'Transfer using Wallet ID only — no phone needed', 'Track all transactions with Ref IDs in real-time', 'M-Pesa style confirmation messages in your inbox'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xs">✓</span>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-md mx-auto">A complete financial toolkit for personal and business use in Kenya</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="rounded-3xl gradient-hero p-8 lg:p-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
            Join thousands of Kenyans managing their money smarter with InstantAid Pay
          </p>
          {user ? (
            <Button variant="accent" size="lg" onClick={() => navigate('/dashboard')} className="text-base px-8">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="accent" size="lg" onClick={() => navigate('/register')} className="text-base px-8">
              Create Your Wallet
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Index;
