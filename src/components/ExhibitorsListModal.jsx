import React, { useState, useMemo } from 'react';
import { X, GraduationCap, MapPin, Award, Search, Globe } from 'lucide-react';

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
  if (countryName.toLowerCase().includes('emirates') || countryName.toLowerCase().includes('uae')) return 'UAE';
  if (countryName.toLowerCase() === 'ksa' || countryName.toLowerCase().includes('saudi')) return 'Saudi Arabia';
  return match || countryName;
};

const getFlagUrl = (countryName) => {
  const normalized = getNormalizedCountry(countryName);
  const code = COUNTRY_CODES[normalized] || COUNTRY_CODES[Object.keys(COUNTRY_CODES).find(k => normalized?.includes(k))];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

export default function ExhibitorsListModal({ isOpen, onClose, exhibitors, eventColor, sponsorTiers }) {
  const [groupBy, setGroupBy] = useState('tier'); // 'tier' or 'country'
  const [searchQuery, setSearchQuery] = useState('');

  // Move hooks before the conditional return
  const exhibitingPartners = useMemo(() => 
    exhibitors.filter(e => e.isExhibitor !== false), 
    [exhibitors]
  );

  const filteredExhibitors = useMemo(() => 
    exhibitingPartners.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.country?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [exhibitingPartners, searchQuery]
  );

  const groupedData = useMemo(() => {
    if (groupBy === 'tier') {
      const tiers = sponsorTiers || [
        { label: 'Main Sponsor' },
        { label: 'Strategic Partner/s' },
        { label: 'Platinum Sponsor/s' },
        { label: 'Gold Sponsor/s' },
        { label: 'Silver Sponsor/s' },
        { label: 'Bronze Sponsor/s' },
        { label: 'Participations' }
      ];
      
      return tiers.map(tier => ({
        title: tier.label,
        icon: <Award size={18} />,
        items: filteredExhibitors.filter(ex => ex.sponsorType === tier.label)
      })).filter(group => group.items.length > 0);
    } else {
      const countryMap = filteredExhibitors.reduce((acc, ex) => {
        const name = getNormalizedCountry(ex.country);
        if (!acc[name]) acc[name] = [];
        acc[name].push(ex);
        return acc;
      }, {});

      return Object.keys(countryMap).sort().map(country => ({
        title: country,
        icon: <Globe size={18} />,
        flag: getFlagUrl(country),
        items: countryMap[country]
      }));
    }
  }, [filteredExhibitors, groupBy, sponsorTiers]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container exhibitors-list-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header-refined">
          <div className="modal-header-title">
            <GraduationCap size={20} style={{ color: eventColor }} />
            <h3>Partners & Exhibitors</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-controls">
            <div className="modal-search-bar">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search exhibitors..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="modal-tabs">
              <button 
                className={`modal-tab ${groupBy === 'tier' ? 'active' : ''}`}
                onClick={() => setGroupBy('tier')}
                style={groupBy === 'tier' ? { borderColor: eventColor, color: eventColor } : {}}
              >
                By Sponsor Tier
              </button>
              <button 
                className={`modal-tab ${groupBy === 'country' ? 'active' : ''}`}
                onClick={() => setGroupBy('country')}
                style={groupBy === 'country' ? { borderColor: eventColor, color: eventColor } : {}}
              >
                By Country
              </button>
            </div>
          </div>

          <div className="modal-scroll-area">
            {groupedData.length === 0 ? (
              <div className="modal-empty-state">
                <p>No exhibitors found matching your search.</p>
              </div>
            ) : (
              groupedData.map((group, idx) => (
                <div key={idx} className="modal-group-section">
                  <div className="modal-group-header">
                    {group.flag ? (
                      <img src={group.flag} alt="" className="group-flag" />
                    ) : (
                      <span className="group-icon" style={{ color: eventColor }}>{group.icon}</span>
                    )}
                    <h4>{group.title}</h4>
                    <span className="group-count">{group.items.length}</span>
                  </div>
                  <div className="modal-items-grid">
                    {group.items.map((ex, exIdx) => (
                      <div key={exIdx} className="modal-exhibitor-card">
                        <div className="modal-exhibitor-logo">
                          <img src={ex.logo} alt={ex.name} />
                        </div>
                        <div className="modal-exhibitor-info">
                          <div className="modal-exhibitor-name">{ex.name}</div>
                          <div className="modal-exhibitor-meta">
                            <MapPin size={12} />
                            <span>{ex.country || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
