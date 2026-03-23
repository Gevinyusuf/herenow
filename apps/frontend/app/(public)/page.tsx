'use client';

import { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import WaitingListModal from '@/components/landing/WaitingListModal';
import GoogleSignInModal from '@/components/landing/GoogleSignInModal';

export default function HomePage() {
  const [showWaitingListModal, setShowWaitingListModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-600">
      <Navbar onSignInClick={() => setShowSignInModal(true)} />
      
      <GoogleSignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
      
      <WaitingListModal 
        isOpen={showWaitingListModal} 
        onClose={() => setShowWaitingListModal(false)} 
      />

      <main>
        <Hero onJoinClick={() => setShowWaitingListModal(true)} />
        <Features />
        <Pricing onJoinClick={() => setShowWaitingListModal(true)} />
        <CTA onJoinClick={() => setShowWaitingListModal(true)} />
      </main>
      <Footer />
    </div>
  );
}
