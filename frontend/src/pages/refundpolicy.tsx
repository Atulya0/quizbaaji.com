import React from 'react';
import { motion } from 'framer-motion';
import PlayButton from '../components/PlayButton'; // Optional: Only if used elsewhere

const refundpolicy = () => {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Refund</h1>
          <p>In case any refund is approved, you’ll be automatically refunded on your original payment method within 10 business</p>
        </header>

       

       
      </div>
    </>
  );
};

export default refundpolicy;
