import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        {/* Top: Branding & Description */}
        <div className="footer-brand-section">
          <div className="footer-brand-container">
            <img src="/logos/Midpoint_white.svg" alt="Midpoint Logo" className="footer-brand-logo" />
            <div className="footer-brand-tagline">
              <h4>PREMIUM EVENT SOLUTIONS</h4>
              <p>Elevating experiences across the Middle East with world-class execution and planning excellence.</p>
            </div>
          </div>
          
          <div className="footer-social-wrapper">
             <div className="footer-social-links">
               <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram" className="social-link"><Instagram size={20} /></a>
               <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook" className="social-link"><Facebook size={20} /></a>
               <a href="#" target="_blank" rel="noopener noreferrer" title="Twitter" className="social-link"><Twitter size={20} /></a>
               <a href="#" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="social-link"><Linkedin size={20} /></a>
             </div>
          </div>
        </div>

        <div className="footer-divider" />

        {/* Middle: Locations Grid */}
        <div className="footer-locations-section">
          <div className="footer-locations-grid">
            {/* UAE Office */}
            <div className="footer-glass-card">
              <div className="card-accent" />
              <h3 className="footer-loc-title">UAE OFFICE</h3>
              <div className="footer-loc-info">
                <div className="footer-loc-item">
                  <MapPin size={16} className="footer-loc-icon" />
                  <span>Tamouh Tower 08th Floor Office No 801 Reem Island Abu Dhabi, UAE</span>
                </div>
                <div className="footer-loc-item">
                  <Phone size={16} className="footer-loc-icon" />
                  <span>+971 2 58 28 499 | +971 55 39 57 577</span>
                </div>
                <div className="footer-loc-item">
                  <Mail size={16} className="footer-loc-icon" />
                  <span>admin@midpoint.ae</span>
                </div>
              </div>
            </div>

            {/* Bahrain Office */}
            <div className="footer-glass-card">
              <div className="card-accent" />
              <h3 className="footer-loc-title">BAHRAIN OFFICE</h3>
              <div className="footer-loc-info">
                <div className="footer-loc-item">
                  <MapPin size={16} className="footer-loc-icon" />
                  <span>Office No. 12, Building 2572, Road - Street 2833, Block 428, Seef District, Kingdom of Bahrain</span>
                </div>
                <div className="footer-loc-item">
                  <Phone size={16} className="footer-loc-icon" />
                  <span>+973 77333339 | +973 77333338</span>
                </div>
              </div>
            </div>

            {/* KSA Address */}
            <div className="footer-glass-card">
              <div className="card-accent" />
              <h3 className="footer-loc-title">KSA ADDRESS</h3>
              <div className="footer-loc-info">
                <div className="footer-loc-item">
                  <MapPin size={16} className="footer-loc-icon" />
                  <span>Bldg. 9037 Al Farzdaq, 3218 Al Malaz District, Riyadh, Kingdom of Saudi Arabia 12642</span>
                </div>
                <div className="footer-loc-item">
                  <Phone size={16} className="footer-loc-icon" />
                  <span>+966 50 042 2155</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright & Fine Print */}
        <div className="footer-bottom-section">
          <div className="footer-bottom-inner">
            <p className="copyright-text">
              © {new Date().getFullYear()} Midpoint Events. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
