'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <head>
        <title>Kong | Docs</title>
        <meta name="description" content="Documentation for ThrottleX platforms and projects" />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-16 text-center">
          <h2 className="text-5xl font-bold mb-6 text-black">
            Welcome to ThrottleX Docs
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-700 leading-relaxed">
            Find all the information you need to use ThrottleX platforms and projects
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="#" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-gray-800/30">
              Get Started
            </Link>
            <Link href="#" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium">
              Explore Products
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "ThrottleX Connect",
              icon: "🔌",
              description: "An end-to-end SaaS API lifecycle management platform designed for the cloud native era.",
              links: ["Connect Overview", "Get Started With Connect", "Connect-compatible Plugins"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            },
            {
              title: "ThrottleX Gateway",
              icon: "🚪",
              description: "A lightweight, fast, and flexible cloud-native API gateway.",
              links: ["Gateway Overview", "Get Started", "Plugins", "Admin API"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            },
            {
              title: "ThrottleX Mesh",
              icon: "🌐",
              description: "Enterprise service mesh based on Kuma for multi-cloud and multi-cluster deployments.",
              links: ["Mesh Overview", "Quickstart", "Kuma (open-source)"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            },
            {
              title: "AI Gateway",
              icon: "🤖",
              description: "Multi-LLM gateway to route, secure, observe, and govern AI provider use.",
              links: ["Overview"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            },
            {
              title: "Service Catalog",
              icon: "📋",
              description: "Comprehensive catalog of all services running in your organization.",
              links: ["Overview"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            },
            {
              title: "Dev Portal",
              icon: "👨‍💻",
              description: "Self-service developer experience to discover and consume services.",
              links: ["Overview"],
              bg: "bg-gray-50",
              border: "border-gray-200"
            }
          ].map((product, index) => (
            <div 
              key={index} 
              className={`${product.bg} border ${product.border} rounded-xl p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden relative`}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                {product.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-black transition-colors duration-300 flex items-center">
                <span className="mr-3">{product.icon}</span>
                {product.title}
              </h3>
              <p className="mb-6 text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                {product.description}
              </p>
              <div className="space-y-3">
                {product.links.map((link, i) => (
                  <Link 
                    key={i} 
                    href="#" 
                    className="block text-gray-700 hover:text-black hover:underline transition-colors duration-300 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-gray-700 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-black text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              {
                title: "PRODUCTS",
                items: ["Kong Konnect", "Kong Gateway", "Kong Mesh", "AI Gateway", "Service Catalog", "Dev Portal"]
              },
              {
                title: "RESOURCES",
                items: ["Documentation", "Blog", "Webinars", "Case Studies", "API Patterns", "Whitepapers"]
              },
              {
                title: "COMMUNITY",
                items: ["GitHub", "Slack", "Forum", "Events", "Contributors", "Open Source"]
              },
              {
                title: "COMPANY",
                items: ["About Us", "Careers", "Newsroom", "Contact", "Partners", "Leadership"]
              }
            ].map((section, index) => (
              <div key={index} className="hover:scale-[1.02] transition-transform duration-300">
                <h4 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="hover:translate-x-2 transition-transform duration-300">
                      <Link 
                        href="#" 
                        className="text-gray-400 hover:text-white hover:underline transition-all duration-300 flex items-center"
                      >
                        <span className="mr-2 opacity-0 hover:opacity-100 transition-opacity duration-300">→</span>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4 text-white">
                POWERING THE API WORLD
              </h2>
              <p className="text-gray-400 max-w-2xl">
                Increase developer productivity, security and performance at scale with the unified platform for API management, service mesh, and ingress controller.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="#" 
                className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium shadow-lg hover:shadow-gray-200/30 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="flex flex-wrap justify-center gap-4 mb-4 md:mb-0">
              {["Terms of Service", "Privacy Policy", "Trust Center", "Compliance", "Security", "Status"].map((item, i) => (
                <Link 
                  key={i} 
                  href="#" 
                  className="text-gray-500 hover:text-white hover:underline transition-colors duration-300"
                >
                  {item}
                </Link>
              ))}
            </div>
            <div className="text-gray-500">
              © {new Date().getFullYear()} ThrottleX Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
