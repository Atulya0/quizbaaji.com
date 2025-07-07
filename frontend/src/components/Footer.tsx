import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
              <Link to="/" className="flex items-center">
      <div className="flex items-center">
        <img
          src="/assets/logo.png"
          alt="Q"
          className="h-10 w-10 brightness-200"
        />
        <span className="text-2xl font-bold -ml-1 text-white">
          uizBaaji
        </span>
      </div>
    </Link>
            <p className="text-sm text-gray-400 mb-4">
              Test your knowledge, challenge your friends, and learn something new with our interactive quiz platform.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1BjXsCTcs5/" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a> */}
              <a href="https://www.instagram.com/quizbaaji?igsh=YndqdnBxYTFtcWVr" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a> */}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <a 
                  href="https://play.quizbaaji.com/#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-500 hover:text-accent-400 transition-colors"
                >
                  Play Now
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                {/* <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a> */}
                 <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a> */}
                <Link to="/TermsConditions" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a> */}
                <Link to="/refundpolicy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <span>care@quizbaaji.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <span>+91 7599616292</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
               <span>Noida, UP</span>

              </li>
            </ul>
          </div>
        </div>

       <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500 space-y-1">
  <p>&copy; {currentYear} QuizBaaji. All rights reserved.</p>
 
</div>
</div>
    </footer>
  );
};

export default Footer;