import React from 'react';
import { motion } from 'framer-motion';
import PlayButton from '../components/PlayButton'; // Optional: Only if used elsewhere

const TermsConditions = () => {
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
            {/* <h1 className="mb-6">Terms and Conditions</h1>
            <p className="text-xl mb-0 text-primary-100">
              Please read these Terms of Use carefully before using Quizbaaji
            </p> */}
          </motion.div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-white"
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}
        ></div>
      </section>

      {/* Terms Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 animate-fade-in mt-5 text-gray-900">
        <header className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms and Conditions</h1>
        </header>

        <p className="mb-4">
          These Terms of Use ("Terms") govern your access to and use of the website, application, and services
          (collectively, the “Service”) provided by Quizbaaji ("Company," "we," or "us"). By accessing or using
          the Service, you ("User" or "you") agree to comply with and be bound by these Terms. If you do not agree
          with these Terms, please do not use the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          <strong>1.1</strong> By accessing or using the Service, you agree to these Terms and any additional terms or
          policies that may be posted on the Service from time to time.
          <br />
          <strong>1.2</strong> The Company reserves the right to modify or update these Terms at any time. We will
          notify you of significant changes by posting the new Terms on this page with a revised "Last Updated" date.
          Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of the Service</h2>
        <p className="mb-4">
          <strong>2.1</strong> The Service is intended for users who are 18 years old or older.
          <br />
          <strong>2.2</strong> You may use the Service for lawful purposes only and in accordance with these Terms. You agree not to use the Service in a manner that:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Violates any applicable law or regulation</li>
          <li>Infringes upon the rights of others, including intellectual property rights</li>
          <li>Is harmful, abusive, or disruptive to the Service or other users</li>
        </ul>
<p className="mb-4">
  <strong>2.3</strong> Before participating in any quiz or challenge, users are required to make a one-time payment of ₹39. Access to gameplay features will only be granted upon successful payment.
</p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
        <p className="mb-4">
          <strong>3.1</strong> Some features of the Service may require you to create an account. You agree to provide
          accurate, current, and complete information and maintain the security of your login credentials.
          <br />
          <strong>3.2</strong> You are responsible for all activities under your account. Notify us immediately of any
          breach of security or unauthorized use.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Privacy and Data Collection</h2>
        <p className="mb-4">
          Your use of the Service is also governed by our Privacy Policy, which outlines how we collect, use, and
          protect your personal information. By using the Service, you agree to the practices described in the Privacy
          Policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Content</h2>
        <p className="mb-4">
          <strong>5.1 User Content:</strong> You retain ownership of any content you upload, post, or otherwise submit to the Service.
          By submitting content, you grant us a non-exclusive, royalty-free, worldwide license to use, display, and distribute it.
        </p>
        <p className="mb-4">
          <strong>5.2 Prohibited Content:</strong> You may not upload or share content that:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Violates any third-party rights</li>
          <li>Is defamatory, obscene, or otherwise unlawful</li>
          <li>Contains viruses or harmful code</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
        <p className="mb-4">
          All intellectual property rights to the Service, including the design, code, and trademarks, are owned by
          Quizbaaji or its licensors. You may not use or reproduce them without permission.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Termination</h2>
        <p className="mb-4">
          <strong>7.1</strong> We may suspend or terminate your access to the Service without notice if you violate these Terms.
          <br />
          <strong>7.2</strong> You may terminate your account at any time by contacting us.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimers and Limitation of Liability</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>The Service is provided "as is" without warranties of any kind</li>
          <li>We do not guarantee that the Service will be error-free or uninterrupted</li>
          <li>We are not liable for indirect or consequential damages</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify and hold harmless Quizbaaji, its employees, and affiliates from any claims arising from
          your use of the Service or violation of these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Governing Law and Dispute Resolution</h2>
        <p className="mb-4">
          <strong>10.1</strong> These Terms are governed by the laws of India.
          <br />
          <strong>10.2</strong> Disputes will be resolved via mediation or arbitration in Noida, UP.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. General Provisions</h2>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Entire Agreement:</strong> These Terms constitute the full agreement between you and us.</li>
          <li><strong>Severability:</strong> If any provision is invalid, the rest remain in effect.</li>
          <li><strong>Waiver:</strong> Our failure to enforce any part of these Terms is not a waiver of rights.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Information</h2>
        <ul className="mt-4 space-y-2">
          <li><strong>Email:</strong> care@quizbaaji.com</li>
          <li><strong>Phone:</strong> +91 7599616292</li>
          <li><strong>Address:</strong> Noida, UP</li>

        </ul>
         <p>This website is managed by <span className="text-black font-medium">Sailesh Kumar Yadhuvansi</span>.</p>
      </div>
    </>
  );
};

export default TermsConditions;
