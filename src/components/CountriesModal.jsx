import React from 'react';
import { X, Globe, Users } from 'lucide-react';

const COUNTRY_CODES = {
  'United Arab Emirates': 'ae',
  'UAE': 'ae',
  'Saudi Arabia': 'sa',
  'KSA': 'sa',
  'Qatar': 'qa',
  'Oman': 'om',
  'Kuwait': 'kw',
  'Bahrain': 'bh',
  'UK': 'gb',
  'USA': 'us',
  'Canada': 'ca',
  'Australia': 'au',
  'Jordan': 'jo',
  'Lebanon': 'lb',
  'Egypt': 'eg',
  'Malaysia': 'my',
  'Turkey': 'tr',
  'India': 'in',
  'Pakistan': 'pk',
  'France': 'fr',
  'Germany': 'de',
  'Spain': 'es',
  'Italy': 'it',
  'China': 'cn',
  'Japan': 'jp',
  'Switzerland': 'ch',
  'Ireland': 'ie',
  'New Zealand': 'nz',
  'Singapore': 'sg',
};

const getNormalizedCountry = (countryName) => {
  if (!countryName) return 'Other';
  const match = Object.keys(COUNTRY_CODES).find(k => 
    countryName.toLowerCase().includes(k.toLowerCase())
  );
  // Special case for United Arab Emirates / UAE
  if (countryName.toLowerCase().includes('emirates') || countryName.toLowerCase().includes('uae')) {
    return 'UAE';
  }
  if (countryName.toLowerCase() === 'ksa' || countryName.toLowerCase().includes('saudi')) {
    return 'Saudi Arabia';
  }
  return match || countryName;
};

const getFlagUrl = (countryName) => {
  const normalized = getNormalizedCountry(countryName);
  const code = COUNTRY_CODES[normalized] || COUNTRY_CODES[Object.keys(COUNTRY_CODES).find(k => normalized?.includes(k))];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

export default function CountriesModal({ isOpen, onClose, exhibitors, eventColor }) {
  if (!isOpen) return null;

  // Only count those who are exhibitors
  const exhibitingPartners = exhibitors.filter(e => e.isExhibitor !== false);

  // Calculate counts per country (Normalized)
  const countryData = exhibitingPartners.reduce((acc, ex) => {
    const name = getNormalizedCountry(ex.country);
    if (!acc[name]) {
      acc[name] = { name, count: 0, flag: getFlagUrl(name) };
    }
    acc[name].count++;
    return acc;
  }, {});

  const sortedCountries = Object.values(countryData).sort((a, b) => b.count - a.count);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container countries-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <Globe size={20} style={{ color: eventColor }} />
            <h3>Participating Countries</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Exploring global educational opportunities from {sortedCountries.length} countries.
          </p>

          <div className="countries-grid">
            {sortedCountries.map((country, index) => (
              <div key={index} className="country-row">
                <div className="country-info">
                  <div className="country-flag-wrapper">
                    {country.flag ? (
                      <img src={country.flag} alt={country.name} className="country-flag-img" />
                    ) : (
                      <div className="country-flag-placeholder"><Globe size={16} /></div>
                    )}
                  </div>
                  <span className="country-name">{country.name}</span>
                </div>
                <div className="country-stat">
                  <span className="country-count" style={{ color: eventColor }}>{country.count}</span>
                  <span className="country-stat-label">{country.count === 1 ? 'Exhibitor' : 'Exhibitors'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
