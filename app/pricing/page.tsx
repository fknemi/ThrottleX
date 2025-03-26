'use client';
import React from 'react';
import Link from 'next/link';

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "for 30 days",
      description: "Perfect for small projects",
      cta: "Start Free Trial",
      features: ["10K requests", "5 services", "Basic analytics", "Community support", "30-day free trial"],
      featured: false,
      cardStyle: "bg-gray-100 border-gray-300 hover:shadow-2xl hover:scale-110 text-black transition-transform duration-300 ease-in-out hover:ring-4 hover:ring-gray-300 hover:bg-gray-200"
    },
    {
      name: "Professional",
      price: "$499",
      period: "per month",
      description: "Growing businesses",
      cta: "Get Started",
      features: ["100K requests", "20 services", "Advanced analytics", "Priority support", "Rate limiting"],
      featured: true,
      cardStyle: "bg-gray-200 border-gray-400 hover:shadow-2xl hover:scale-110 text-black transition-transform duration-300 ease-in-out hover:ring-4 hover:ring-gray-400 hover:bg-gray-300"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Mission critical apps",
      cta: "Contact Sales",
      features: ["Unlimited", "Premium analytics", "24/7 support", "Advanced security"],
      featured: false,
      cardStyle: "bg-gray-300 border-gray-500 hover:shadow-2xl hover:scale-110 text-black transition-transform duration-300 ease-in-out hover:ring-4 hover:ring-gray-500 hover:bg-gray-400"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <section className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold text-black mb-4">
            Empowering Your Growth with Flexible Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs and scale seamlessly with our API gateway solutions.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {plans.map((plan, i) => (
              <div 
                key={i} 
                className={`relative rounded-2xl p-8 border ${plan.cardStyle} transform transition-all duration-500 hover:rotate-1`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold px-4 py-2 rounded-bl-lg rounded-tr-lg animate-pulse">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-gray-600 ml-2">{plan.period}</span>}
                </div>
                <Link 
                  href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                  className="block text-center bg-black text-white font-semibold py-3 px-6 rounded-lg mb-8 hover:bg-gray-800 transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start">
                      <span className="text-green-600">✔</span>
                      <span className="ml-2 text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
