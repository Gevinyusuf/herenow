import { ArrowRight } from 'lucide-react';

interface CTAProps {
  onJoinClick: () => void;
}

export default function CTA({ onJoinClick }: CTAProps) {
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
}

