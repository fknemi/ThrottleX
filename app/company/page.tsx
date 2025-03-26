// pages/why-kong.js
'use client';

import React from 'react';

export default function WhyKongPage() {
  const features = [
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Unparalleled speed with low-latency processing and high throughput.",
      bg: "from-white to-gray-50",
      border: "hover:border-blue-400/30"
    },
    {
      icon: "🔗",
      title: "Universal Connectivity",
      description: "Effortlessly connect systems, protocols, and clouds with flexibility.",
      bg: "from-white to-gray-50",
      border: "hover:border-indigo-400/30"
    },
    {
      icon: "🛡️",
      title: "Enterprise Security",
      description: "End-to-end encryption and fine-grained access control for protection.",
      bg: "from-white to-gray-50",
      border: "hover:border-purple-400/30"
    }
  ];

  return (
    <>
      <article className="relative min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col items-center justify-center p-8 text-gray-900 overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${i%2 ? 'bg-gray-200/50' : 'bg-gray-300/30'} rounded-full blur-xl animate-float`}
              style={{
                width: `${100 + Math.random() * 200}px`,
                height: `${100 + Math.random() * 200}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${15 + Math.random() * 20}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <main className="max-w-5xl text-center space-y-12 relative z-10">
          <header className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Why is Throttle<span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">X</span>
              <br />for Modernization?
            </h1>
            
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            ThrottleX is the ultimate API gateway and service mesh, engineered for performance, security, and scalability.
              <span className="block mt-3 text-gray-500">Unlock seamless connectivity with enterprise-grade protection.</span>
            </p>
          </header>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <article 
                  key={index}
                  className={`bg-gradient-to-br ${feature.bg} p-8 rounded-2xl border border-gray-200 ${feature.border} transition-all duration-300 relative overflow-hidden group hover:scale-[1.03] hover:shadow-lg`}
                >
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 group-hover:opacity-10 transition-opacity duration-500" aria-hidden="true" />
                  <div className="text-6xl mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700" aria-hidden="true">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 group-hover:from-blue-700 group-hover:to-indigo-800 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-2xl pointer-events-none transition-all duration-500" aria-hidden="true" />
                </article>
              ))}
            </div>
          </section>
          
          <section>
            <button 
              className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group hover:scale-[1.03] active:scale-95"
              aria-label="Learn more about Kong's features"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></span>
              <span className="relative z-10 flex items-center justify-center gap-2">
                Learn More 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </section>
        </main>
        
        <footer className="mt-16 text-gray-500 text-sm relative">
          <p>© {new Date().getFullYear()} ThrottleX Inc. All rights reserved.</p>
        </footer>

        <style jsx global>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            50% {
              transform: translateY(-20px) translateX(10px);
            }
          }
          .animate-float {
            animation: float infinite ease-in-out;
          }
        `}</style>
      </article>
    </>
  );
}
