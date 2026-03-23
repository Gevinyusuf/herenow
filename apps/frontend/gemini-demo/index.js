import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  Globe, 
  Zap, 
  Users, 
  Share2, 
  BarChart3, 
  Smartphone, 
  Menu, 
  X,
  Calendar,
  ShieldCheck,
  Mail,
  MessageCircle, // Used for Discord generic icon
  Bot, // For AI representation
  PartyPopper, // For success state
  Linkedin,
  Phone,
  MapPin
} from 'lucide-react';

// --- Styles & Fonts ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');
      .font-lalezar {
        font-family: 'Lalezar', display;
      }
      .text-brand {
        color: #FF6B3D;
      }
      .bg-brand {
        background-color: #FF6B3D;
      }
      .hover-bg-brand:hover {
        background-color: #e55a2f;
      }
      .border-brand {
        border-color: #FF6B3D;
      }
    `}
  </style>
);

// --- Components ---

const WaitingListModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
        
        <div className="p-8">
          {!isSubmitted ? (
            <>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="text-brand w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Join the Waiting List</h3>
              <p className="text-slate-600 mb-6">
                We're working hard to bring HereNow to life. Be the first to know when we launch and get early access benefits.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-brand text-white py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Joining...' : 'Join Now'}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in bounce-in duration-500">
                <PartyPopper className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">You're on the list!</h3>
              <p className="text-slate-600 mb-6">
                Thank you for your interest! We are currently accelerating development to bring you the best AI event experience. Stay tuned!
              </p>
              <button 
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onJoinClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <FontStyles />
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Text Logo */}
          <div className="flex items-center cursor-pointer">
            <span className="text-4xl font-lalezar text-brand tracking-wide">
              HereNow
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-brand font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-brand font-medium transition-colors">Pricing</a>
            <button 
              onClick={onJoinClick}
              className="bg-slate-900 hover:bg-brand text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
            >
              Join Waiting List
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="text-slate-800" /> : <Menu className="text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-xl md:hidden flex flex-col p-6 gap-4 animate-in slide-in-from-top-5 duration-200 border-t border-slate-100">
            <a href="#features" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <hr className="border-slate-100" />
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onJoinClick();
              }}
              className="w-full py-3 text-center font-bold text-white bg-brand rounded-lg shadow-md"
            >
              Join Waiting List
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

const Hero = ({ onJoinClick }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full text-brand font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          AI-Powered Event Intelligence
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
          Make Every Encounter <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B3D] to-red-600">Count</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
          HereNow is the intelligent, <strong>AI-powered</strong> platform for event socialization and management. 
          Create your digital identity instantly and let AI connect you with the right people and opportunities. 
          Here, Now, Limitless.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
          <button 
            onClick={onJoinClick}
            className="group bg-slate-900 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl hover:shadow-orange-500/20 hover:bg-brand flex items-center gap-2"
          >
            Join Waiting List
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="https://discord.gg/YG55pNqg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all flex items-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Join Community
          </a>
        </div>

        {/* Hero Visual / Mockup Placeholder */}
        <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B3D] to-pink-500 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden p-4 md:p-8">
             {/* Simple conceptual UI illustration */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Card 1: User Profile */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="avatar" />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-slate-800 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-4/5 bg-slate-100 rounded"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Globe size={16} /></div>
                     <div className="p-2 bg-orange-50 text-brand rounded-lg"><Share2 size={16} /></div>
                  </div>
                </div>

                {/* Card 2: Main Event Dashboard (Center) */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-100 relative z-10 transform scale-105">
                  <div className="flex justify-between items-center mb-6">
                    <div className="font-bold text-lg text-slate-800">Tech Summit 2025</div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Live</span>
                  </div>
                  <div className="flex justify-between text-center mb-6">
                     <div>
                       <div className="text-2xl font-bold text-slate-900">1k+</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">Check-ins</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-brand">856</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">Interactions</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-slate-900">98%</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">NPS</div>
                     </div>
                  </div>
                  <div className="h-24 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
                    <BarChart3 className="mr-2" /> AI Insights Active
                  </div>
                </div>

                {/* Card 3: Connection Notification */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-green-100 text-green-600 rounded-full"><Bot size={16} /></div>
                     <span className="font-semibold text-slate-700">AI Suggestion</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`} alt="avatar" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">Sarah Chen</p>
                      <p className="text-slate-500">Best match for: Fintech</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors">
                    Say Hello
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand font-semibold tracking-wide uppercase text-sm mb-3">Features</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Engineered for Meaningful Connections</h3>
          <p className="text-lg text-slate-600">
            Whether you are an event organizer or an attendee, HereNow equips you with the tools to break the barrier between online and offline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Zap}
            color="bg-orange-500"
            title="Instant Digital Card"
            desc="Ditch paper business cards. Exchange contact info instantly via QR code or NFC, and showcase your professional identity with a custom profile."
          />
          <FeatureCard 
            icon={Users}
            color="bg-blue-500"
            title="Smart Networking"
            desc="Our location and AI-based algorithm recommends the most relevant people to meet at any event, making every introduction timely."
          />
          <FeatureCard 
            icon={Calendar}
            color="bg-purple-500"
            title="All-in-One Management"
            desc="From registration to check-in and post-event analytics. Digitalize your entire workflow and make organizing events effortless."
          />
          <FeatureCard 
            icon={ShieldCheck}
            color="bg-green-500"
            title="Privacy First"
            desc="You have full control over your data. Selectively share contact details, with all interactions encrypted for your peace of mind."
          />
          <FeatureCard 
            icon={Share2}
            color="bg-pink-500"
            title="Seamless Integrations"
            desc="Connect with the tools you love. Seamlessly sync with Google Calendar, Zoom, and more to streamline your workflow."
          />
          <FeatureCard 
            icon={BarChart3}
            color="bg-indigo-500"
            title="Deep Insights"
            desc="Understand your event impact. Analyze engagement, retention, and interaction hotspots through our visual data dashboard."
          />
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({ title, price, period, features, isPopular, buttonText, onButtonClick }) => (
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

const Pricing = ({ onJoinClick }) => {
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
};

const CTA = ({ onJoinClick }) => {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative p-12 text-center">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Networking?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Be among the first to experience the future of connection. Join our waiting list today and get early access benefits.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={onJoinClick}
                className="bg-brand hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-orange-500/40 flex items-center gap-2"
              >
                Join Waiting List
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mt-4">No spam, just updates on our launch.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-start">
          {/* Left Side: Brand */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-3xl font-lalezar text-slate-900 tracking-wide">
                HereNow
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              HereNow is an AI-native platform designed to eliminate the friction in event management. 
              We empower creators to monetize their expertise and foster local, authentic communities globally.
            </p>
          </div>

          {/* Center: Menu */}
          <div className="flex flex-col gap-4 pt-2 md:pl-12">
            <h4 className="font-bold text-slate-900 mb-2">Menu</h4>
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-slate-600 hover:text-brand transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-brand transition-colors font-medium">Pricing</a>
              <a href="https://discord.gg/YG55pNqg" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-2 font-medium">
                Community <ArrowRight size={14} />
              </a>
            </div>
          </div>
          
          {/* Right Side: Contact */}
          <div className="flex flex-col gap-2 pt-2">
             <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
             <div className="flex flex-col gap-3 text-sm text-slate-600 mb-6">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
                <span>1111B S Governors Ave, STE 48047<br/>Dover, DE 19904</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-brand shrink-0" />
                <span>+1 (213) 536-0031</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-brand shrink-0" />
                <a href="mailto:timzhangherenow@gmail.com" className="hover:text-brand">timzhangherenow@gmail.com</a>
              </div>
            </div>

            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/company/herenow-events/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-colors cursor-pointer"
              >
                <Linkedin size={16}/>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © 2025 HereNow Events Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main App Component ---

export default function HereNowLanding() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-600">
      <Navbar onJoinClick={() => setShowModal(true)} />
      
      <WaitingListModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />

      <main>
        <Hero onJoinClick={() => setShowModal(true)} />
        <Features />
        <Pricing onJoinClick={() => setShowModal(true)} />
        <CTA onJoinClick={() => setShowModal(true)} />
      </main>
      <Footer />
    </div>
  );
}