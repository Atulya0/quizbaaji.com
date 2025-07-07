import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

const ContactPage = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

const socialLinks: { [key: string]: string } = {
  facebook: 'https://www.facebook.com/share/1BjXsCTcs5/',
  instagram: 'https://www.instagram.com/quizbaaji?igsh=YndqdnBxYTFtcWVr',
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormState({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 100
      }
    }
  };

  // Contact info data
  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-primary-500" />,
      title: 'Email Us',
      details: 'care@quizbaaji.com',
      description: 'We\'ll respond within 24 hours'
    },
    {
      icon: <Phone className="h-6 w-6 text-primary-500" />,
      title: 'Call Us',
      details: '+91 7599616292',
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary-500" />,
      title: 'Visit Us',
      details: '123 Quiz Street, Knowledge City',
      description: 'India, 400001'
    }
  ];

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
            <h1 className="mb-6">Get in Touch</h1>
            <p className="text-xl mb-0 text-primary-100">
              Have questions or feedback? We'd love to hear from you!
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {contactInfo.map((item, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="card p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="rounded-full bg-primary-50 p-4 inline-flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="font-medium text-gray-800 mb-1">{item.details}</p>
                <p className="text-gray-500">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md p-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
              
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="rounded-full bg-green-100 p-4 inline-flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you as soon as possible.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="btn btn-primary"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="" disabled>Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary w-full flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                          <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {[
                    {
                      question: 'How do I create an account on QuizBaaji?',
                      answer: 'You can create an account by clicking the "Sign Up" button on our homepage. Fill in your details, verify your email, and you\'re ready to start quizzing!'
                    },
                    {
                      question: 'Are the quizzes free to play?',
                      answer: 'Yes, most of our quizzes are free to play. We also offer premium quizzes with advanced features for subscribers.'
                    },
                    {
                      question: 'How can I suggest a new quiz topic?',
                      answer: 'You can suggest new quiz topics through our contact form or by emailing us directly at suggestions@quizbaaji.com.'
                    },
                    {
                      question: 'Can I use QuizBaaji for educational purposes?',
                      answer: 'Absolutely! Many educators use our platform for interactive learning. Contact us for special educational plans and features.'
                    }
                  ].map((faq, index) => (
                    <details 
                      key={index} 
                      className="group bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <summary className="flex items-center justify-between p-4 cursor-pointer font-medium">
                        {faq.question}
                        <svg 
                          className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
                <p className="text-gray-600 mb-4">
                  Follow us on social media for quiz updates, knowledge facts, and community events.
                </p>
                
               <div className="flex space-x-4">
  {['facebook', 'instagram'].map((platform) => (
    <a
      key={platform}
      href={socialLinks[platform]}
      target="_blank"
      rel="noopener noreferrer"
      className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 hover:bg-primary-200 transition-colors"
    >
      <span className="sr-only">{platform}</span>

      {/* Facebook icon */}
      {platform === 'facebook' && (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.334v21.333C0 23.402.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.24l-1.918.001c-1.504 0-1.794.715-1.794 1.763v2.31h3.587l-.467 3.622h-3.12V24h6.116C23.403 24 24 23.402 24 22.667V1.333C24 .598 23.403 0 22.675 0z"/>
        </svg>
      )}

      {/* Instagram icon */}
      {platform === 'instagram' && (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.055 1.987.24 2.457.403a4.919 4.919 0 011.675 1.087 4.919 4.919 0 011.087 1.675c.163.47.348 1.287.403 2.457.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.987-.403 2.457a4.918 4.918 0 01-1.087 1.675 4.919 4.919 0 01-1.675 1.087c-.47.163-1.287.348-2.457.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.987-.24-2.457-.403a4.919 4.919 0 01-1.675-1.087 4.919 4.919 0 01-1.087-1.675c-.163-.47-.348-1.287-.403-2.457C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.055-1.17.24-1.987.403-2.457a4.918 4.918 0 011.087-1.675A4.918 4.918 0 015.398 2.636c.47-.163 1.287-.348 2.457-.403C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.332.013 7.052.072 5.773.13 4.65.324 3.678.654a7.067 7.067 0 00-2.574 1.645A7.067 7.067 0 00.654 4.873C.324 5.845.13 6.968.072 8.248.013 9.527 0 9.937 0 13.2c0 3.263.013 3.673.072 4.952.058 1.28.252 2.403.582 3.375a7.067 7.067 0 001.645 2.574 7.067 7.067 0 002.574 1.645c.972.33 2.095.524 3.375.582C8.332 23.987 8.741 24 12 24s3.673-.013 4.952-.072c1.28-.058 2.403-.252 3.375-.582a7.067 7.067 0 002.574-1.645 7.067 7.067 0 001.645-2.574c.33-.972.524-2.095.582-3.375.059-1.279.072-1.689.072-4.952s-.013-3.673-.072-4.952c-.058-1.28-.252-2.403-.582-3.375a7.067 7.067 0 00-1.645-2.574A7.067 7.067 0 0020.322.654c-.972-.33-2.095-.524-3.375-.582C15.673.013 15.263 0 12 0zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
        </svg>
      )}
    </a>
  ))}
</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white">
        <div className="h-96 w-full">
        <iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14018.74231348406!2d77.3547154!3d28.5355161!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce58f5c94c09f%3A0xd6f9b3a1f6ce1123!2sNoida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1689611981404!5m2!1sen!2sin"
  width="100%"
  height="100%"
  style={{ border: 0 }}
  allowFullScreen={true}
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>

        </div>
      </section>
    </>
  );
};

export default ContactPage;