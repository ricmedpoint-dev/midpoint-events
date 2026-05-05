import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Clock, User, MessageCircle, Heart, Send, Trash, Settings, Globe, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PlaceholderImage from '../components/PlaceholderImage';
import RegisterModal from '../components/RegisterModal';
import EnquiryModal from '../components/EnquiryModal';
import ExhibitorAdminModal, { SPONSOR_TYPES } from '../components/ExhibitorAdminModal';
import ExhibitorDetailModal from '../components/ExhibitorDetailModal';
import TierSettingsModal from '../components/TierSettingsModal';
import '../styles/Exhibitors.css';
import { 
  getEventBySlug, 
  toggleLike, 
  checkIfLiked, 
  addComment, 
  subscribeToComments, 
  deleteComment,
  getExhibitorsByEvent 
} from '../firebase/firestore';

const DEFAULT_TIERS = [
  { id: 'main', label: 'Main Sponsor', color: '#1d7dcc' },
  { id: 'strategic', label: 'Strategic Partner/s', color: '#1d7dcc' },
  { id: 'platinum', label: 'Platinum Sponsor/s', color: '#E5E4E2' },
  { id: 'gold', label: 'Gold Sponsor/s', color: '#FFD700' },
  { id: 'silver', label: 'Silver Sponsor/s', color: '#C0C0C0' },
  { id: 'bronze', label: 'Bronze Sponsor/s', color: '#CD7F32' },
  { id: 'others', label: 'Others / Participations', color: '#f0f0f0' }
];

// Fallback data for individual event if firestore fails
const fallbackEvents = [
  {
    id: 'gcc-exhibition-2024',
    slug: 'gcc-exhibition-2024',
    title: 'GCC Exhibition 2024',
    language: 'English / Arabic',
    date: '25 - 27 September 2024',
    location: 'Manarat, Al Saadiyat, UAE',
    image: '/events/gcc-exhibition-2024.png',
    description: 'The GCC Exhibition for Education and Training is a prominent annual event designed to provide students with a comprehensive platform to explore educational opportunities and make informed decisions about their future. Held in Abu Dhabi, the capital of the United Arab Emirates, this exhibition...',
  },
  {
    id: 'gcc-exhibition-rak',
    slug: 'gcc-exhibition-rak',
    title: 'GCC Exhibition RAK',
    language: 'English / Arabic',
    date: '28 - 29 October 2025',
    location: 'RAK Exhibition Center, UAE',
    image: '/events/gcc-exhibition-rak.png',
    description: 'Join us for the GCC Exhibition RAK, where leading educational institutions from the region and beyond gather to showcase their programs. This event is a great opportunity for students in the Northern Emirates to connect with academic representatives and explore various career paths.',
  },
  {
    id: 'iue-riyadh',
    slug: 'iue-riyadh',
    title: 'International University Expo',
    language: 'English / Arabic',
    date: 'January 2025',
    location: 'Riyadh, Saudi Arabia',
    image: '/events/iue-riyadh.png',
    description: 'The International University Expo in Riyadh brings together top universities from around the world. Students can learn about undergraduate and postgraduate programs, scholarship opportunities, and the admission process. It is a must-visit event for anyone looking to study abroad.',
  },
  {
    id: 'gcc-al-ain',
    slug: 'gcc-al-ain',
    title: 'GCC Exhibition Al Ain',
    language: 'English / Arabic',
    date: '28 - 29 April 2025',
    location: 'ADNEC Al Ain, UAE',
    image: '/events/gcc-al-ain.png',
    description: 'Experience the latest in education and training at the GCC Exhibition Al Ain. This event features a wide range of academic institutions and vocational training providers, offering students in the Garden City a chance to explore their future possibilities close to home.',
  },
];

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Required to access the passed state
  const { user } = useAuth();
  
  // Use passed state if available for instant loading
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showExhibitorAdminModal, setShowExhibitorAdminModal] = useState(false);
  const [showExhibitorDetailModal, setShowExhibitorDetailModal] = useState(false);
  const [showTierSettingsModal, setShowTierSettingsModal] = useState(false);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const { isAdmin } = useAuth();

  // Exhibitors State
  const [exhibitors, setExhibitors] = useState([]);
  const [exhibitorsLoading, setExhibitorsLoading] = useState(true);

  // Social State
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(event?.likesCount || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Guest ID management
  const [guestId] = useState(() => {
    let id = localStorage.getItem('midpoint_guest_id');
    if (!id) {
      id = 'guest-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('midpoint_guest_id', id);
    }
    return id;
  });


  const loadEventData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await getEventBySlug(slug);
      if (data) {
        setEvent(data);
        setLikesCount(data.likesCount || 0);
      } else {
        const fallback = fallbackEvents.find((e) => e.slug === slug);
        if (fallback) setEvent(fallback);
      }
    } catch (err) {
      console.warn('Using fallback data for detail:', err.message);
      const fallback = fallbackEvents.find((e) => e.slug === slug);
      if (fallback) setEvent(fallback);
    } finally {
      if (isInitial) setLoading(true); // Should be false, but let's match logic
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event && event.slug === slug) {
      setLoading(false);
      return;
    }
    loadEventData(true);
  }, [slug]);

  const fetchExhibitors = async () => {
    if (!event?.id) return;
    try {
      const data = await getExhibitorsByEvent(event.id);
      setExhibitors(data);
    } catch (err) {
      console.error("Failed to fetch exhibitors", err);
    } finally {
      setExhibitorsLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitors();
  }, [event?.id]);

  const groupedExhibitors = (event?.sponsorTiers || DEFAULT_TIERS).reduce((acc, tier) => {
    const list = exhibitors.filter(ex => ex.sponsorType === tier.label);
    if (list.length > 0) acc.push({ type: tier.label, list, tierId: tier.id, color: tier.color });
    return acc;
  }, []);

  const getGroupTitle = (type, count) => {
    if (type.startsWith('Others')) return 'Others';
    
    // Clean the "/s" from the type string
    let base = type.replace(/\/s$/, '').split(' (')[0];
    
    if (count > 1) {
      // Plural
      if (base.endsWith('Partner')) return base + 's';
      if (base.endsWith('Sponsor')) return base + 's';
      if (base === 'Participation') return 'Participations';
      return base;
    } else {
      // Singular
      if (base === 'Participations') return 'Participation';
      return base;
    }
  };

  const getContrastColor = (hex) => {
    if (!hex) return '#333';
    const color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length !== 6) return '#333';
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#333' : '#fff';
  };

  const getTierClass = (type) => {
    const tiers = event?.sponsorTiers || DEFAULT_TIERS;
    const tier = tiers.find(t => t.label === type);
    return tier ? `tier-${tier.id}` : 'tier-base';
  };

  // Social Effects
  useEffect(() => {
    const currentUserId = user?.uid || guestId;
    if (event?.id && currentUserId) {
      checkIfLiked(event.id, currentUserId).then(setLiked);
    }
  }, [event?.id, user?.uid, guestId]);

  useEffect(() => {
    if (event?.id) {
      const unsubscribe = subscribeToComments(event.id, setComments);
      return () => unsubscribe();
    }
  }, [event?.id]);

  const handleLike = async () => {
    const currentUserId = user?.uid || guestId;
    if (!currentUserId) return;
    
    // Optimistic UI
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);
    
    try {
      await toggleLike(event.id, currentUserId);
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      console.error("Like failed", err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    
    // Require name for guests
    if (!user && !guestName.trim()) {
      alert("Please provide your name to comment.");
      return;
    }

    setIsSubmittingComment(true);
    const commentData = {
      userId: user?.uid || guestId,
      userName: user?.name || guestName.trim() || 'Visitor',
      userPhoto: user?.photoURL || null,
      text: newComment.trim(),
      isGuest: !user
    };

    try {
      await addComment(event.id, commentData);
      setNewComment('');
      // Keep guestName for convenience
    } catch (err) {
      alert("Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment(commentId, event.id);
    } catch (err) {
      alert("Failed to delete comment.");
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!event) return <div className="error-state">Event not found.</div>;

  return (
    <div className="event-detail-page">
      {/* Banner Section */}
      <div className="detail-banner">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        {event.mediaUrl || event.image ? (
          <img src={event.mediaUrl || event.image} alt={event.title} className="detail-hero-img" />
        ) : (
          <PlaceholderImage height="100%" label={event.title} />
        )}
      </div>

      {/* Content Section */}
      <div 
        className="detail-content-card"
        style={{ borderTopColor: event.eventColor || '#E31E24' }}
      >
        <div className="drag-handle" />
        
        <div className="detail-header-row">
          <h1 className="detail-title">{event.title}</h1>
          <button 
            className={`detail-like-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            style={{ color: liked ? (event.eventColor || '#E31E24') : '#999' }}
          >
            <Heart size={24} fill={liked ? (event.eventColor || '#E31E24') : 'transparent'} />
            <span>{likesCount}</span>
          </button>
        </div>
        
        <div className="detail-info-list">
          <div className="info-item">
            <div className="icon-circle">
              <Calendar 
                size={18} 
                className="info-icon" 
                style={{ color: event.eventColor || '#999' }}
              />
            </div>
            <span>{event.date}</span>
          </div>
          <div className="info-item">
            <div className="icon-circle">
              <MapPin 
                size={18} 
                className="info-icon"
                style={{ color: event.eventColor || '#999' }}
              />
            </div>
            <span>{event.location}</span>
          </div>
          {event.eventTime && (
            <div className="info-item">
              <div className="icon-circle">
                <Clock 
                  size={18} 
                  className="info-icon"
                  style={{ color: event.eventColor || '#999' }}
                />
              </div>
              <span>{event.eventTime}</span>
            </div>
          )}
        </div>

        <div className="detail-description">
          <h2>Event Description</h2>
          <div className="description-content">
            {event.description ? (
              event.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            ) : (
              <p>No description available for this event.</p>
            )}
          </div>
        </div>

        {/* ── Exhibitors Section ── */}
        <div 
          className="exhibitors-section"
          style={(event?.sponsorTiers || DEFAULT_TIERS).reduce((acc, tier) => {
            acc[`--tier-${tier.id}-color`] = tier.color;
            return acc;
          }, {})}
        >
          {isAdmin && (
            <div className="admin-manage-exhibitors">
              <div className="admin-manage-title">
                <User size={18} />
                <span>Admin: Manage Exhibitors</span>
              </div>
              <div className="admin-action-btns">
                <button 
                  className="btn-admin-add"
                  onClick={() => {
                    setSelectedExhibitor(null);
                    setShowExhibitorAdminModal(true);
                  }}
                >
                  <Send size={14} />
                  <span>Add Exhibitor</span>
                </button>

                <button 
                  className="btn-admin-add"
                  onClick={() => setShowTierSettingsModal(true)}
                  style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                >
                  <Settings size={14} />
                  <span>Tier Settings</span>
                </button>
              </div>
            </div>
          )}

          {groupedExhibitors.length > 0 ? (
            groupedExhibitors.map((group, gIdx) => (
              <div key={gIdx} className={`exhibitors-group ${getTierClass(group.type)}`}>
                <h3 className="group-header">
                  {getGroupTitle(group.type, group.list.length)}
                  <span className="group-count">({group.list.length})</span>
                </h3>
                <div className="exhibitors-grid">
                  {group.list.map((ex) => (
                    <div 
                      key={ex.id} 
                      className="exhibitor-card"
                      style={{ 
                        '--event-color': event.eventColor || '#E31E24',
                        '--tier-color': group.color,
                        '--tier-text-color': getContrastColor(group.color)
                      }}
                      onClick={() => {
                        if (isAdmin && window.confirm("Edit this exhibitor? (Cancel to just view)")) {
                          setSelectedExhibitor(ex);
                          setShowExhibitorAdminModal(true);
                        } else {
                          setSelectedExhibitor(ex);
                          setShowExhibitorDetailModal(true);
                        }
                      }}
                    >
                      <div className="exhibitor-logo-container">
                        <img src={ex.logo} alt={ex.name} className="exhibitor-logo" />
                      </div>
                      <div className="exhibitor-name-tag">{ex.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            !exhibitorsLoading && <p className="no-comments" style={{ textAlign: 'center', padding: '20px' }}>Exhibitors list will be updated soon.</p>
          )}
        </div>

        {/* Social Section: Comments */}
        <div className="detail-social-section">
          <div className="social-header">
            <h3>Comments ({comments.length})</h3>
          </div>

          <form className="comment-form" onSubmit={handleComment}>
            {!user && (
              <input 
                type="text" 
                placeholder="Your Name" 
                className="guest-name-input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            )}
            <div className="comment-input-row">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
              />
              <button type="submit" disabled={!newComment.trim() || isSubmittingComment}>
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.userPhoto ? (
                      <img src={comment.userPhoto} alt={comment.userName} />
                    ) : (
                      <div className="avatar-placeholder">{comment.userName?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="comment-body">
                    <div className="comment-user-row">
                      <span className="comment-username">{comment.userName}</span>
                      <div className="comment-meta-actions">
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {(user?.uid === comment.userId || guestId === comment.userId || user?.email === 'admin@midpoint.ae') && (
                          <button 
                            className="comment-delete-btn"
                            onClick={() => handleDeleteComment(comment.id)}
                            aria-label="Delete comment"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first to join the conversation!</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="detail-actions">
        <button 
          className="btn-register" 
          onClick={() => setShowRegisterModal(true)}
          style={{ '--btn-color': event?.eventColor || '#E31E24' }}
        >
          <User size={18} />
          <span>REGISTER FOR FREE</span>
        </button>
        <button className="btn-enquire" onClick={() => setShowEnquiryModal(true)}>
          <MessageCircle size={18} />
          <span>Enquire to Exhibit</span>
        </button>
      </div>

      {/* Modals */}
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
        event={event}
      />
      <EnquiryModal 
        isOpen={showEnquiryModal} 
        onClose={() => setShowEnquiryModal(false)} 
        event={event}
      />
      <ExhibitorAdminModal 
        isOpen={showExhibitorAdminModal}
        onClose={() => setShowExhibitorAdminModal(false)}
        eventId={event?.id}
        exhibitor={selectedExhibitor}
        onSaved={() => {
          fetchExhibitors();
        }}
        sponsorTiers={event?.sponsorTiers}
      />
      <ExhibitorDetailModal 
        isOpen={showExhibitorDetailModal}
        onClose={() => setShowExhibitorDetailModal(false)}
        exhibitor={selectedExhibitor}
        eventColor={event?.eventColor}
      />

      <TierSettingsModal 
        isOpen={showTierSettingsModal}
        onClose={() => setShowTierSettingsModal(false)}
        event={event}
        onSaved={loadEventData}
      />
    </div>
  );
}
