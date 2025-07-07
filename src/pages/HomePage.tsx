import React from 'react';
import { motion } from 'framer-motion';
import PlayButton from '../components/PlayButton';
import { Star, CheckCircle, Clock, Award, Users, Target, BookOpen, Trophy } from 'lucide-react';
// @ts-ignore
import CountdownTimer from '../components/CountdownTimer';

const HomePage = () => {
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

  // Features data
  const features = [
    {
      icon: <Star className="h-8 w-8 text-primary-500" />,
      title: 'Diverse Quiz Categories',
      description: 'From history to pop culture, our quizzes cover it all to keep you engaged and learning.'
    },
    {
      icon: <Clock className="h-8 w-8 text-primary-500" />,
      title: 'Timed Challenges',
      description: 'Test your knowledge under pressure with our exciting timed quiz challenges.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-500" />,
      title: 'Compete with Friends',
      description: 'Challenge your friends and see who tops the leaderboard in various categories.'
    },
    {
      icon: <Award className="h-8 w-8 text-primary-500" />,
      title: 'Earn Achievements',
      description: 'Unlock badges and achievements as you master different quiz categories.'
    }
  ];

  // How to Play steps
  const howToPlaySteps = [
    {
      icon: <Target className="h-8 w-8 text-accent-500" />,
      title: 'Choose Your Category',
      description: 'Select from a wide range of topics that interest you, from Science to Pop Culture. Users are required to make a one-time payment of ₹39. Access to gameplay features will only be granted upon successful payment.'
    },
    {
      icon: <Clock className="h-8 w-8 text-accent-500" />,
      title: 'Answer Questions',
      description: 'Read each question carefully and select your answer before the timer runs out.'
    },
    {
      icon: <BookOpen className="h-8 w-8 text-accent-500" />,
      title: 'Learn and Improve',
      description: 'Review your answers and learn from detailed explanations after each quiz.'
    },
    {
      icon: <Trophy className="h-8 w-8 text-accent-500" />,
      title: 'Track Progress',
      description: 'Monitor your performance and compete for top positions on the leaderboard.'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      content: "QuizBaaji has transformed how I spend my free time. Now I learn while having fun!",
      author: "Arjun Sharma",
      // role: "College Student"
    },
    {
      content: "The variety of quizzes is amazing. I've learned so much about topics I never explored before.",
      author: "Priya Patel",
      // role: "Teacher"
    },
    {
      content: "Our family quiz nights using QuizBaaji have become a weekly tradition. Everyone loves it!",
      author: "Raj Malhotra",
      // role: "IT Professional"
    }
  ];

  // Statistics data
  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '5000+', label: 'Quizzes Completed' },
    { value: '25+', label: 'Categories' },
    { value: '4.8/5', label: 'User Rating' }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center gradient-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-primary-700/50 z-0"></div>
        <div className="container-custom relative z-10 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white"
            >
              <h1 className="mb-4">
                Challenge Your Mind with <span className="text-accent-400">QuizBaaji</span>
              </h1>
              <p className="text-xl mb-8 text-gray-100">
                Test your knowledge, challenge your friends, and expand your horizons with our diverse collection of engaging quizzes.
              </p>

              <div className="mb-8">
             <CountdownTimer targetDate={new Date(2025, 5, 19, 0, 0, 0).getTime()} />

 {/* 1 hour from now */}
              </div>
              <div className="flex flex-wrap gap-4">
                <PlayButton size="large" />
                <motion.a
                  href="#how-to-play"
                  className="btn btn-outline border-white text-white hover:bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  How to Play
                </motion.a>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <motion.div 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <div className="flex justify-between items-center mb-6">

                      <div className="flex items-center">
        <img
          src="/assets/logo.png"
          alt="Q"
          className="h-10 w-10 brightness-200"
        />
        <span className="text-2xl font-bold -ml-1 text-black">
          uizBaaji
        </span>
      </div>
                  
                    <div className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                      General Knowledge
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="font-medium">Which planet is known as the Red Planet?</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center">
                          <div className="h-5 w-5 rounded-full border border-gray-300 mr-2"></div>
                          <span>Venus</span>
                        </div>
                        <div className="flex items-center bg-green-100 p-1 rounded">
                          <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center mr-2">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Mars</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-5 w-5 rounded-full border border-gray-300 mr-2"></div>
                          <span>Jupiter</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-5 w-5 rounded-full border border-gray-300 mr-2"></div>
                          <span>Mercury</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Question 3 of 10</div>
                    <button className="btn btn-primary">Next Question</button>
                  </div>
                </motion.div>
                <div className="absolute -bottom-4 -right-4 -left-4 h-8 bg-black/10 blur-md rounded-full z-[-1]"></div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <motion.a
            href="#how-to-play"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-white animate-bounce"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </motion.a>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="page-section bg-gray-50">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-primary-700">How to Play</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Get started with QuizBaaji in four simple steps and begin your journey of knowledge and fun.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {howToPlaySteps.map((step, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="relative card p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="rounded-full bg-accent-50 p-3 inline-flex mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="page-section bg-white">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-primary-700">Why Choose QuizBaaji?</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Our platform offers a unique experience that combines learning and entertainment, making knowledge acquisition fun and engaging.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="card p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="rounded-full bg-primary-50 p-3 inline-flex mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="page-section bg-primary-700 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="mb-4">Ready to Test Your Knowledge?</h2>
                <p className="text-xl mb-6 text-primary-100">
                  Jump right into our interactive quizzes and challenge yourself or compete with friends.
                </p>
                <PlayButton className="shadow-lg" />
              </motion.div>
            </div>
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 gap-4"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-primary-200">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-primary-700">What Our Users Say</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Discover how QuizBaaji has transformed learning experiences for our community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="mb-4 text-accent-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="inline-block h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="mb-4 text-gray-700">{testimonial.content}</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  {/* <div className="text-sm text-gray-500">{testimonial}</div> */}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="page-section bg-secondary-700 text-white text-center">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6">Begin Your Quiz Journey Today</h2>
            <p className="text-xl mb-8 text-secondary-100">
              Challenge yourself, learn new facts, and have fun with our engaging quizzes!
            </p>
            <PlayButton size="large" className="shadow-xl" />
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;