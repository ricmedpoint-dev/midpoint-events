import { useState, useEffect } from 'react';
import { X, Save, Palette, ChevronUp, ChevronDown, Type, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const DEFAULT_TIERS = [
  { id: 'main', label: 'Main Sponsor', color: '#1d7dcc' },
  { id: 'strategic', label: 'Strategic Partner', color: '#1d7dcc' },
  { id: 'platinum', label: 'Platinum Sponsor', color: '#E5E4E2' },
  { id: 'gold', label: 'Gold Sponsor', color: '#FFD700' },
  { id: 'silver', label: 'Silver Sponsor', color: '#C0C0C0' },
  { id: 'bronze', label: 'Bronze Sponsor', color: '#CD7F32' },
  { id: 'others', label: 'Participations', color: '#f0f0f0' }
];

export default function TierSettingsModal({ isOpen, onClose, event, onSaved }) {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event?.sponsorTiers && event.sponsorTiers.length > 0) {
      setTiers(event.sponsorTiers);
    } else {
      setTiers(DEFAULT_TIERS);
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const moveTier = (index, direction) => {
    const newTiers = [...tiers];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tiers.length) return;
    
    [newTiers[index], newTiers[newIndex]] = [newTiers[newIndex], newTiers[index]];
    setTiers(newTiers);
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const addTier = () => {
    const newId = `custom-${Date.now()}`;
    setTiers([...tiers, { id: newId, label: 'New Sponsorship Type', color: '#f0f0f0' }]);
  };

  const removeTier = (index) => {
    if (tiers.length <= 1) return;
    if (!window.confirm("Remove this sponsorship tier? Any exhibitors currently in this tier will move to 'Others' until reassigned.")) return;
    const newTiers = [...tiers];
    newTiers.splice(index, 1);
    setTiers(newTiers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const eventRef = doc(db, 'banners', event.id);
      await updateDoc(eventRef, {
        sponsorTiers: tiers
      });
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exhibitor-modal-overlay" onClick={onClose}>
      <div className="exhibitor-modal-container" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexShrink: 0 }}>
          <Palette size={24} color="var(--color-primary)" />
          <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Tier Settings</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px', flexShrink: 0 }}>
          Customize the hierarchy, labels, and colors of sponsorship tiers.
        </p>

        <form className="exhibitor-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} onSubmit={handleSubmit}>
          <div className="tier-settings-list" style={{ 
            display: 'grid', 
            gap: '12px', 
            overflowY: 'auto', 
            flex: 1, 
            paddingRight: '10px',
            marginBottom: '20px'
          }}>
            {tiers.map((tier, index) => (
              <div key={tier.id} className="tier-setting-row" style={{ 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center', 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button type="button" onClick={() => moveTier(index, -1)} disabled={index === 0} style={{ padding: '2px', border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b' }}>
                    <ChevronUp size={16} />
                  </button>
                  <button type="button" onClick={() => moveTier(index, 1)} disabled={index === tiers.length - 1} style={{ padding: '2px', border: 'none', background: 'none', cursor: index === tiers.length - 1 ? 'default' : 'pointer', color: index === tiers.length - 1 ? '#cbd5e1' : '#64748b' }}>
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    value={tier.label} 
                    onChange={e => updateTier(index, 'label', e.target.value)}
                    placeholder="Sponsorship Type Label"
                    style={{ fontSize: '0.9rem', padding: '10px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={tier.color} 
                    onChange={e => updateTier(index, 'color', e.target.value)}
                    style={{ width: '35px', height: '35px', padding: '2px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeTier(index)} 
                    style={{ padding: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
            <button 
              type="button" 
              onClick={addTier}
              style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1px dashed #bbf7d0', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              <span>Add Sponsorship Type</span>
            </button>
            <button 
              type="submit" 
              className="btn-visit-site" 
              style={{ flex: 1.5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              disabled={isSubmitting}
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
