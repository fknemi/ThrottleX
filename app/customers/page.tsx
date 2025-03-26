import React from "react";
import Link from "next/link";

export default function Customers() {
  const customers = [
    { id: 1, name: "PayPal", industry: "Fintech", description: "A global leader in digital payments, providing secure online transactions." },
    { id: 2, name: "TransUnion", industry: "Credit Reporting", description: "A trusted source for credit reports and financial insights." },
    { id: 3, name: "ThermoFisher Scientific", industry: "Biotech", description: "Advancing science with innovative biotech and healthcare solutions." },
    { id: 4, name: "Nasdaq", industry: "Financial Services", description: "Powering capital markets with trading, analytics, and data services." },
    { id: 5, name: "GSK", industry: "Pharmaceuticals", description: "A global pharmaceutical giant developing life-saving medicines and vaccines." },
    { id: 6, name: "CARVANA", industry: "E-commerce", description: "Revolutionizing car buying with a seamless online experience." },
  ];

  return (
    <div className="min-h-screen bg-white text-black py-16 px-8 md:px-16">
      <main>
        {/* Header Section */}
        <section className="text-center">
          <h1 className="text-5xl font-extrabold text-black">
            Businesses Become <span className="text-gray-600">API-First</span> with ThrottleX
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mt-4">
            From startups to Fortune 500 companies, organizations worldwide rely on ThrottleX
            to build cutting-edge digital experiences faster, more efficiently, and securely.
          </p>
        </section>

        {/* Customer Logos Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-semibold text-black text-center mb-12">
            Trusted by Industry Leaders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div
                  className="bg-gray-100 rounded-2xl shadow-md p-8 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer border border-gray-300"
                >
                  <h3 className="text-2xl font-semibold text-black mb-3">{customer.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{customer.industry}</p>
                  <p className="text-gray-500 text-sm italic mb-4">{customer.description}</p>
                  <div className="inline-block bg-black text-white text-xs px-4 py-2 rounded-full font-bold">
                    API ONLINE
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mt-16">
          <h2 className="text-4xl font-bold text-black">
            Ready to <span className="text-gray-600">Scale Your Business?</span>
          </h2>
          <p className="text-lg text-gray-700 mt-4 mb-6">
            Join top companies using ThrottleX API gateway to transform their digital ecosystem.
          </p>
          <Link href="/get-started">
            <button className="bg-black text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:bg-gray-800 hover:scale-105 shadow-lg">
              Get Started with ThrottleX
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
