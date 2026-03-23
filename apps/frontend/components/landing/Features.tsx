import { Zap, Users, Calendar, ShieldCheck, Share2, BarChart3 } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}

const FeatureCard = ({ icon: Icon, title, desc, color }: FeatureCardProps) => (
  <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default function Features() {
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
}

