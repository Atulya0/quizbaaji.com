import React from 'react';
import { motion } from 'framer-motion';
import PlayButton from '../components/PlayButton'; // Assuming it's used elsewhere

const PrivacyPage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pb-24 bg-primary-700 text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            {/* <h1 className="mb-6">Privacy Policy</h1>
            <p className="text-xl mb-0 text-primary-100">
             Last Updated: May 1, 2025
            </p> */}
          </motion.div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-white"
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}
        ></div>
      </section>

      {/* Privacy Content Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 animate-fade-in mt-5 text-gray-900">
        <header className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last Updated: May 1, 2025</p>
        </header>

        <p className="mb-4">
          Quizbaaji ("Company," "we," "our," or "us") respects your privacy and is committed to protecting the
          personal information you share with us. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you visit our website, use our application, or access our services
          (collectively, the "Service"). Please read this Privacy Policy carefully. By using our Service,
          you consent to the practices described herein.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>

        <h3 className="font-medium mb-2">1.1 Personal Information</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Billing address</li>
          <li>Payment information</li>
          <li>Account login credentials</li>
        </ul>

        <h3 className="font-medium mb-2">1.2 Usage Data</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Device information</li>
          <li>Pages visited on our site or app</li>
          <li>Time and date of access</li>
          <li>Referring URL</li>
        </ul>

        <h3 className="font-medium mb-2">1.3 Cookies and Tracking Technologies</h3>
        <p className="mb-4">
          We use cookies and similar tracking technologies to track activity on our Service and hold certain
          information. For more information, please refer to our Cookie Policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>To provide, maintain, and improve our Service</li>
          <li>To personalize your experience and communicate with you</li>
          <li>To process transactions and manage payments</li>
          <li>To respond to customer service inquiries and provide support</li>
          <li>To send promotional materials, offers, and updates (you can opt out at any time)</li>
          <li>To comply with legal obligations and enforce our policies</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Share Your Information</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <strong>Service Providers:</strong> Third-party vendors performing services such as payment processing,
            analytics, and hosting.
          </li>
          <li>
            <strong>Legal Requirements:</strong> If required by law, court order, or to prevent fraud or enforce rights.
          </li>
          <li>
            <strong>Business Transfers:</strong> In case of a merger, acquisition, or asset sale.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
        <p className="mb-4">
          We implement administrative, technical, and physical safeguards to protect your data. However, no method is
          100% secure.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
        <p className="mb-4">
          We retain personal data only as long as necessary for our purposes or as required by law. We then securely
          delete or anonymize it.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Privacy Rights</h2>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Access:</strong> Request your stored data</li>
          <li><strong>Correction:</strong> Fix inaccuracies</li>
          <li><strong>Deletion:</strong> Request deletion where applicable</li>
          <li><strong>Opt-Out:</strong> From marketing communications</li>
          <li><strong>Data Portability:</strong> Receive your data in machine-readable format</li>
          <li><strong>Withdraw Consent:</strong> At any time</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children’s Privacy</h2>
        <p className="mb-4">
          We do not knowingly collect data from individuals under 16. If such data is found, it will be deleted promptly.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Transfers</h2>
        <p className="mb-4">
          By using our services, you consent to the transfer of your information to countries outside your own.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Updates to This Privacy Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy periodically. Continued use of the Service indicates acceptance of changes.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <ul className="mt-4 space-y-2">
          <li><strong>Email:</strong> care@quizbaaji.com</li>
          <li><strong>Address:</strong> Noida, UP</li>
        </ul>
      </div>
    </>
  );
};

export default PrivacyPage;
