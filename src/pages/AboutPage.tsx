import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Award, BookOpen, Users, Star } from 'lucide-react';
import PlayButton from '../components/PlayButton';

const AboutPage = () => {
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

  // Team members data
  const teamMembers = [
    {
      name: 'Aditya Sharma',
      role: 'Founder & CEO',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
      bio: 'Quiz enthusiast with a passion for making learning fun and accessible to everyone.'
    },
    {
      name: 'Neha Patel',
      role: 'Content Director',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      bio: 'Former teacher with expertise in creating educational content that engages and challenges.'
    },
    {
      name: 'Rahul Verma',
      role: 'Tech Lead',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
      bio: 'Experienced developer focused on creating seamless and enjoyable quiz experiences.'
    }
  ];

  // Values data
  const values = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary-500" />,
      title: 'Knowledge for All',
      description: 'We believe knowledge should be accessible and engaging for everyone, regardless of background.'
    },
    {
      icon: <Target className="h-8 w-8 text-primary-500" />,
      title: 'Continuous Learning',
      description: 'Our platform encourages lifelong learning through fun and interactive quizzes.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-500" />,
      title: 'Community Growth',
      description: 'Building a community of curious minds who share knowledge and challenge each other.'
    },
    {
      icon: <Star className="h-8 w-8 text-primary-500" />,
      title: 'Excellence',
      description: 'Committed to providing high-quality, accurate, and well-researched quiz content.'
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
            <h1 className="mb-6">About QuizBaaji</h1>
            <p className="text-xl mb-0 text-primary-100">
              Discover the story behind India's fastest-growing quiz platform
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </section>

      {/* Our Story Section */}
      <section className="page-section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
                Our Story
              </div>
              <h2 className="mb-4 text-gray-900">From Passion to Platform</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  QuizBaaji began in 2023 as a simple idea among friends who shared a passion for quizzes and knowledge sharing. What started as weekend quiz competitions in college dorms quickly evolved into a mission to make learning fun and accessible for everyone.
                </p>
                <p>
                  Our founder, Aditya Sharma, recognized that traditional educational approaches often failed to engage students. He envisioned a platform where knowledge acquisition would feel like play rather than work, and where anyone could participate regardless of their educational background.
                </p>
                <p>
                  Today, QuizBaaji has grown into India's fastest-growing quiz platform, offering thousands of quizzes across dozens of categories. We're proud to have built a community of knowledge enthusiasts who learn, compete, and grow together.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-xl shadow-xl">
                <img 
                  src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="QuizBaaji team brainstorming" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 -left-4 h-8 bg-black/10 blur-md rounded-full z-[-1]"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="page-section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1 relative"
            >
              <div className="aspect-w-4 aspect-h-3 overflow-hidden rounded-xl shadow-xl">
                <img 
                  src="https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Students learning through quizzes" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 -left-4 h-8 bg-black/10 blur-md rounded-full z-[-1]"></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-1 lg:order-2"
            >
              <div className="mb-4 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
                Our Mission
              </div>
              <h2 className="mb-4 text-gray-900">Making Learning Fun</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  At QuizBaaji, our mission is to transform how people engage with knowledge. We believe that learning should be an exciting journey, not a tedious task. Through our interactive quizzes, we aim to spark curiosity, foster a love for learning, and build a community of lifelong learners.
                </p>
                <p>
                  We're committed to creating content that is not only educational but also entertaining and accessible to everyone. Whether you're a student looking to test your knowledge, a professional wanting to stay sharp, or someone who simply enjoys learning new things, QuizBaaji is designed for you.
                </p>
                <p>
                  By combining technology with expert-crafted questions, we're building a platform that makes knowledge acquisition a joyful experience and helps people discover the pleasure of learning something new every day.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="page-section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
              Our Values
            </div>
            <h2 className="mb-4">What Drives Us</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Our core values shape everything we do at QuizBaaji, from content creation to community building.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="card p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="rounded-full bg-primary-50 p-3 inline-flex mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      {/* <section className="page-section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800">
              Our Team
            </div>
            <h2 className="mb-4">Meet the Minds Behind QuizBaaji</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-600">
              Our diverse team brings together expertise in education, technology, and content creation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div className="aspect-w-3 aspect-h-2">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <div className="text-primary-600 mb-3">{member.role}</div>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="page-section bg-primary-700 text-white text-center">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6">Join Our Knowledge Revolution</h2>
            <p className="text-xl mb-8 text-primary-100">
              Ready to experience learning in a whole new way? Start your quiz journey today!
            </p>
            <PlayButton size="large" className="shadow-xl" />
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;