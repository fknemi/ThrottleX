'use client';
import React, { useEffect } from 'react';
import Head from 'next/head';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';
import { Session } from 'better-auth';

export default function Home() {
    const router = useRouter()
const [ref, inView] = useInView({ threshold: 0.1 });

const { data, isPending } = authClient.useSession();

  const controls = useAnimation();
  useEffect(() => {
    if (inView) controls.start('visible');
  }, [controls, inView]);

    if (isPending) return <div>Loading...</div>;

    const session = data as Session;

  

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const cardHoverVariants = {
    rest: { 
      y: 0,
      scale: 1,
      rotateZ: 0,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
      borderColor: "#e5e5e5"
    },
    hover: {
      y: -8,
      scale: 1.02,
      rotateZ: 0.5,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
      borderColor: "#111111",
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const floatVariants = {
    float: {
      y: [0, -15, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      <Head>
        <title>Modern API Platform | Elegant Design</title>
        <meta name="description" content="Sophisticated API platform with minimalist design" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --color-black: #111111;
          --color-white: #ffffff;
          --color-gray-100: #f5f5f5;
          --color-gray-200: #e5e5e5;
          --color-gray-800: #262626;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          color: var(--color-black);
          background-color: var(--color-white);
          line-height: 1.6;
        }
        
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        .text-highlight {
          position: relative;
          display: inline-block;
        }
        
        .text-highlight:after {
          content: '';
          position: absolute;
          bottom: 0.1em;
          left: 0;
          right: 0;
          height: 0.4em;
          background-color: var(--color-black);
          opacity: 0.1;
          z-index: -1;
        }

        .hover-grow {
          transition: transform 0.3s ease;
        }
        .hover-grow:hover {
          transform: scale(1.03);
        }

        .hover-underline {
          position: relative;
        }
        .hover-underline:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-black);
          transition: width 0.3s ease;
        }
        .hover-underline:hover:after {
          width: 100%;
        }
      `}</style>

      {/* Hero Section with Enhanced Visuals */}
      <section className="relative bg-white pt-32 pb-24 overflow-hidden">
        <div className="container flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-16 md:mb-0">
            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
            >
              <motion.span variants={itemVariants} className="block">Modern API</motion.span>
              <motion.span variants={itemVariants} className="block">Platform for <span className="text-highlight">Digital Business</span></motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl lg:text-2xl mb-10 text-gray-800 max-w-2xl"
            >
              The elegant solution to build, manage, and secure your API ecosystem.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button 
                whileHover={{ scale: 1.03, backgroundColor: "#000000" }}
                whileTap={{ scale: 0.98 }}
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover-grow transition-all"
                onClick={() => session ? router.push("/dashboard") : router.push("/sign-in")}
              >
                Get Started
              </motion.button>
              <motion.button 
                whileHover={{ 
                  scale: 1.03,
                  backgroundColor: "#111111",
                  color: "#ffffff"
                }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover-grow transition-all"
              >
                View Demo
              </motion.button>
            </motion.div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
              className="relative w-full max-w-lg"
            >
              <motion.div 
                variants={floatVariants}
                animate="float"
                className="bg-gray-100 h-80 md:h-96 rounded-2xl shadow-2xl flex items-center justify-center border border-gray-200 overflow-hidden"
              >
                <div className="text-center p-8">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          opacity: [0.2, 1, 0.2],
                          scale: [0.9, 1.1, 0.9],
                          transition: {
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.1
                          }
                        }}
                        whileHover={{ scale: 1.3 }}
                        className="h-8 bg-black rounded-sm"
                      />
                    ))}
                  </div>
                  <motion.h3 
                    whileHover={{ scale: 1.02 }}
                    className="text-2xl font-semibold mb-3 hover-underline"
                  >
                    API Dashboard
                  </motion.h3>
                  <p className="text-gray-600">Clean interface for API management</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Cards */}
      <section className="py-24 bg-gray-100">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-20">
              <motion.h2 
                whileHover={{ scale: 1.02 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Powerful <span className="text-highlight">Features</span>
              </motion.h2>
              <p className="text-xl text-gray-800 max-w-3xl mx-auto">
                Everything you need to manage your API ecosystem
              </p>
            </motion.div>
            
            <motion.div 
              variants={containerVariants}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  title: "API Gateway",
                  description: "Secure and manage all your API traffic with our high-performance gateway.",
                  icon: "🔌"
                },
                {
                  title: "Developer Portal",
                  description: "Beautiful documentation and sandbox environment for your API consumers.",
                  icon: "📚"
                },
                {
                  title: "Analytics",
                  description: "Real-time insights into API performance and usage patterns.",
                  icon: "📊"
                },
                {
                  title: "Security",
                  description: "Enterprise-grade security with OAuth, JWT, and rate limiting.",
                  icon: "🔒"
                },
                {
                  title: "Service Mesh",
                  description: "Connect and secure your microservices with our lightweight mesh.",
                  icon: "🕸️"
                },
                {
                  title: "Plugins",
                  description: "Extend functionality with our library of pre-built plugins.",
                  icon: "🧩"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  animate="rest"
                  className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 hover-grow"
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="text-4xl mb-6 w-16 h-16 flex items-center justify-center rounded-lg bg-gray-100"
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-4 hover-underline">{feature.title}</h3>
                  <p className="text-gray-700">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="container text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 
              whileHover={{ scale: 1.01 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to transform your API strategy?
            </motion.h2>
            
            <motion.p 
              className="text-xl mb-10 max-w-2xl mx-auto text-gray-300"
            >
              Join thousands of companies building the future with our platform.
            </motion.p>
            
            <motion.div 
              variants={containerVariants}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <motion.button 
                whileHover={{ scale: 1.03, backgroundColor: "#ffffff", color: "#000000" }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover-grow transition-all"
                    onClick={() => router.push("/sign-in")}
              >
                Start Free Trial
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover-grow transition-all"
              >
                Contact Sales
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Modern Enhanced Footer */}
<footer className="bg-gray-900 text-white py-20">
  <div className="container">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="grid md:grid-cols-5 gap-12"
    >
      <div className="md:col-span-2">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold">APIX</h3>
        </motion.div>
        <p className="text-gray-400 mb-6 max-w-md">
          The most elegant solution for modern API management and integration.
        </p>
        <div className="flex gap-4">
          {['twitter'].map((social) => (
            <motion.a
              key={social}
              href="https://x.com/fknemi"
              whileHover={{ y: -3, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 transition-colors"
            >
              <span className="sr-only">{social}</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d={`M24 4.37a9.6 9.6 0 0 1-2.83.8 5.04 5.04 0 0 0 2.17-2.8c-.95.58-2 1-3.13 1.22A4.86 4.86 0 0 0 16.61 2a4.99 4.99 0 0 0-4.79 6.2A13.87 13.87 0 0 1 1.67 2.92 5.12 5.12 0 0 0 3.2 9.67a4.82 4.82 0 0 1-2.23-.64v.07c0 2.44 1.7 4.48 3.95 4.95a4.84 4.84 0 0 1-2.22.08c.63 2.01 2.45 3.47 4.6 3.51A9.72 9.72 0 0 1 0 19.74 13.68 13.68 0 0 0 7.55 22c9.06 0 14-7.7 14-14.37v-.65c.96-.71 1.79-1.6 2.45-2.61z`} />
              </svg>
            </motion.a>
          ))}
        </div>
      </div>
      
      {[
        {
          title: "Product",
          links: ["Features", "Integrations", "Pricing", "Changelog"]
        },
        {
          title: "Company",
          links: ["About us", "Careers", "Blog", "Press"]
        },
        {
          title: "Resources",
          links: ["Documentation", "API Status", "Community", "Tutorials"]
        },
        {
          title: "Legal",
          links: ["Privacy", "Terms", "Security", "GDPR"]
        }
      ].map((section, i) => (
        <div key={i}>
          <motion.h4 
            whileHover={{ x: 5 }}
            className="text-lg font-semibold mb-6 text-gray-200 hover-underline"
          >
            {section.title}
          </motion.h4>
          <ul className="space-y-3">
            {section.links.map((link, j) => (
              <motion.li 
                key={j}
                whileHover={{ x: 5 }}
              >
                <a href={`/${link.toLowerCase()}`} className="text-gray-400 hover:text-indigo-400 transition-colors">
                  {link}
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
    
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center"
    >
      <p className="text-gray-500 mb-4 md:mb-0">
        © {new Date().getFullYear()} APIX Platform. All rights reserved.
      </p>
      <div className="flex gap-6">
        <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
        <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</a>
        <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Cookies</a>
      </div>
    </motion.div>
  </div>
</footer>
    </>
  );
}
