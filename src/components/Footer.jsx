import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-bg-circles">
        <div className="footer-circle footer-circle-1"></div>
        <div className="footer-circle footer-circle-2"></div>
        <div className="footer-circle footer-circle-3"></div>
      </div>

      <div className="footer-content">
        <div className="footer-logo">
          <img src="/logos/Midpoint_white.svg" alt="Midpoint" className="footer-logo-img" />
        </div>

        <h2 className="footer-title">CONNECT WITH US</h2>

        <div className="footer-offices">
          <div className="footer-office">
            <h3 className="office-name">UAE OFFICE</h3>
            <p>Tamouh Tower 08th Floor Office No 801 Reem Island Abu Dhabi, UAE</p>
            <p>+971 2 58 28 499 | +971 55 39 57 577</p>
            <p>Email: admin@midpoint.ae</p>
          </div>

          <div className="footer-office">
            <h3 className="office-name">BAHRAIN OFFICE</h3>
            <p>Office No. 12, Building 2572, Road - Street 2833, Block 428, Seef District, Kingdom of Bahrain</p>
            <p>Tel: +973 77333339 | +973 77333338</p>
          </div>

          <div className="footer-office">
            <h3 className="office-name">KSA ADDRESS</h3>
            <p>Bldg. 9037 Al Farzdaq, 3218 Al Malaz District, Riyadh, Kingdom of Saudi Arabia 12642</p>
            <p>Mob: +966 50 042 2155</p>
          </div>
        </div>

        <div className="footer-bottom">
          <a href="https://www.midpoint.ae" target="_blank" rel="noopener noreferrer" className="footer-website">
            www.midpoint.ae
          </a>
        </div>
      </div>
    </footer>
  );
}
