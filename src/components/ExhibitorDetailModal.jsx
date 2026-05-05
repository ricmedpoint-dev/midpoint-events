import { X, Globe, MapPin, ExternalLink } from 'lucide-react';

export default function ExhibitorDetailModal({ isOpen, onClose, exhibitor, eventColor }) {
  if (!isOpen || !exhibitor) return null;

  return (
    <div className="exhibitor-modal-overlay" onClick={onClose}>
      <div className="exhibitor-modal-container" onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="exhibitor-detail-content">
          <div className="exhibitor-banner-container">
            {exhibitor.image ? (
              <img src={exhibitor.image} className="exhibitor-hero-image" alt={exhibitor.name} />
            ) : (
              <div className="exhibitor-hero-image" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }} />
            )}
            
            {exhibitor.website && (
              <a 
                href={exhibitor.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-banner-visit"
                style={{ backgroundColor: eventColor || '#E31E24' }}
              >
                <span>Visit Website</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="exhibitor-detail-info">
            <div className="exhibitor-header-row">
              <img src={exhibitor.logo} className="exhibitor-detail-logo" alt={exhibitor.name} />
              <div className="exhibitor-main-meta">
                <h2>{exhibitor.name}</h2>
                <div className="meta-tags">
                  {exhibitor.country && (
                    <div className="meta-tag">
                      <MapPin size={14} />
                      <span>{exhibitor.country}</span>
                    </div>
                  )}
                  {exhibitor.website && (
                    <div className="meta-tag">
                      <Globe size={14} />
                      <span>{new URL(exhibitor.website).hostname}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="exhibitor-description">
              {exhibitor.description ? (
                exhibitor.description.split('\n').map((p, i) => <p key={i} style={{ marginBottom: '10px' }}>{p}</p>)
              ) : (
                <p>No description provided for this exhibitor.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
