import { X, Globe, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ExhibitorDetailModal({ isOpen, onClose, exhibitor, eventColor }) {
  const [videoLoading, setVideoLoading] = useState(true);

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

            {exhibitor.videoUrl && (
              <div className="exhibitor-video-section" style={{ marginBottom: '25px' }}>
                <div className="video-responsive-container" style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {videoLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}>
                      <Loader2 className="animate-spin" size={32} color="#cbd5e1" />
                    </div>
                  )}
                  <iframe
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                      opacity: videoLoading ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                      zIndex: 2
                    }}
                    src={exhibitor.videoUrl}
                    title="Promotional Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setVideoLoading(false)}
                  ></iframe>
                </div>
              </div>
            )}

            <div className="exhibitor-description">
              {exhibitor.description ? (
                exhibitor.description.split('\n').map((p, i) => <p key={i} style={{ marginBottom: '10px', textAlign: 'justify' }}>{p}</p>)
              ) : (
                <p>No description provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
