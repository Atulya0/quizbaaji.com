import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/privacy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/refundpolicy'; 

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
             <Route path="/TermsConditions" element={<TermsConditions />} />
           <Route path="/refundpolicy" element={<RefundPolicy />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;