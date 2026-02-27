'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onButtonClick: () => void;
}

const PricingCard = ({ title, price, period, features, isPopular, buttonText, onButtonClick }: PricingCardProps) => (
  <div className={`relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-2 ${
    isPopular 
      ? 'border-brand shadow-2xl scale-105 z-10 bg-white hover:shadow-orange-500/20' 
      : 'border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-orange-200'
  } flex flex-col h-full`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF6B3D] to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
        Most Popular
      </div>
    )}
    <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-4xl font-bold text-slate-900">{price}</span>
      {price !== 'Free' && <span className="text-slate-500">{period}</span>}
    </div>
    <p className="text-slate-600 text-sm mb-8 border-b border-slate-100 pb-6">
      {title === 'Free' ? 'Perfect for getting started with AI events.' : 'For power users who want full control.'}
    </p>
    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feat, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
          <Check className={`w-5 h-5 shrink-0 ${isPopular ? 'text-brand' : 'text-slate-400'}`} />
          {feat}
        </li>
      ))}
    </ul>
    <button 
      onClick={onButtonClick}
      className={`w-full py-3 rounded-xl font-bold transition-all ${
        isPopular 
          ? 'bg-brand hover:bg-orange-600 text-white shadow-lg hover:shadow-orange-500/25' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
      }`}
    >
      {buttonText}
    </button>
  </div>
);

interface PricingProps {
  onJoinClick: () => void;
}

export default function Pricing({ onJoinClick }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-brand font-semibold tracking-wide uppercase text-sm mb-3">Pricing</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Empower Your Events with AI</h3>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8 select-none">
            <span 
              className={`text-sm cursor-pointer transition-all duration-300 ${
                !isAnnual ? 'text-slate-900 font-bold scale-105' : 'text-slate-500'
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </span>
            
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                isAnnual ? 'bg-brand' : 'bg-slate-300'
              }`}
              aria-label="Toggle billing cycle"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isAnnual ? 'translate-x-6' : ''}`}></div>
            </button>

            <span 
              className={`text-sm cursor-pointer transition-all duration-300 ${
                isAnnual ? 'text-slate-900 font-bold scale-105' : 'text-slate-500'
              }`}
              onClick={() => setIsAnnual(true)}
            >
              Yearly <span className="text-brand text-xs font-bold ml-1">(Save ~20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center pt-4">
          <PricingCard 
            title="Free" 
            price="Free" 
            period="/ forever"
            buttonText="Get Started"
            onButtonClick={onJoinClick}
            features={[
              "Unlimited Event Creation",
              "Import Existing Events",
              "Personalized Styles & Animations",
              "Basic AI Event Assistant",
              "Standard support"
            ]} 
          />
          <PricingCard 
            title="Pro" 
            price={isAnnual ? "$39" : "$49"} 
            period="/ month"
            isPopular={true}
            buttonText="Join Waiting List"
            onButtonClick={onJoinClick}
            features={[
              "Everything in Free",
              "0% Ticket Service Fees",
              "Unlimited Advanced AI Assistant",
              "Data Export (Excel/CSV)",
              "Deep Data Analytics",
              "Priority support"
            ]} 
          />
        </div>
      </div>
    </section>
  );
}

