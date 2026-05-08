import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar, MapPin, Clock, User, MessageCircle, Heart, Send, Trash, Settings, Grid3X3, Search, Share2, GraduationCap, Globe, Compass, Users, CalendarClock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PlaceholderImage from '../components/PlaceholderImage';
import RegisterModal from '../components/RegisterModal';
import EnquiryModal from '../components/EnquiryModal';
import ExhibitorAdminModal, { SPONSOR_TYPES } from '../components/ExhibitorAdminModal';
import ExhibitorDetailModal from '../components/ExhibitorDetailModal';
import TierSettingsModal from '../components/TierSettingsModal';
import FloorPlanBuilder from '../components/FloorPlanBuilder';
import FloorPlanViewer from '../components/FloorPlanViewer';
import '../styles/Exhibitors.css';
import { 
  getEventBySlug, toggleLike, checkIfLiked, addComment, 
  subscribeToComments, deleteComment, getExhibitorsByEvent, getFloorPlan 
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

const WHY_ATTEND_DEFAULTS = [
  { icon: '🎓', title: 'Meet Top Universities', desc: 'Connect with prestigious institutions from around the world', bg: '#EEF2FF' },
  { icon: '💰', title: 'Scholarship Opportunities', desc: 'Discover financial aid and scholarship programs available', bg: '#FEF3C7' },
  { icon: '🧭', title: 'Career Guidance', desc: 'Get expert counseling on career paths and academic planning', bg: '#ECFDF5' },
  { icon: '🤝', title: 'Networking', desc: 'Build connections with educators, students, and industry leaders', bg: '#FDF2F8' },
];

const DEFAULT_SCHEDULE = [];

const fallbackEvents = [
  { id: 'gcc-exhibition-2024', slug: 'gcc-exhibition-2024', title: 'GCC Exhibition 2024', language: 'English / Arabic', date: '25 - 27 September 2024', location: 'Manarat, Al Saadiyat, UAE', image: '/events/gcc-exhibition-2024.png', description: 'The GCC Exhibition for Education and Training is a prominent annual event designed to provide students with a comprehensive platform to explore educational opportunities and make informed decisions about their future.' },
  { id: 'gcc-exhibition-rak', slug: 'gcc-exhibition-rak', title: 'GCC Exhibition RAK', language: 'English / Arabic', date: '28 - 29 October 2025', location: 'RAK Exhibition Center, UAE', image: '/events/gcc-exhibition-rak.png', description: 'Join us for the GCC Exhibition RAK, where leading educational institutions from the region and beyond gather to showcase their programs.' },
  { id: 'iue-riyadh', slug: 'iue-riyadh', title: 'International University Expo', language: 'English / Arabic', date: 'January 2025', location: 'Riyadh, Saudi Arabia', image: '/events/iue-riyadh.png', description: 'The International University Expo in Riyadh brings together top universities from around the world.' },
  { id: 'gcc-al-ain', slug: 'gcc-al-ain', title: 'GCC Exhibition Al Ain', language: 'English / Arabic', date: '28 - 29 April 2025', location: 'ADNEC Al Ain, UAE', image: '/events/gcc-al-ain.png', description: 'Experience the latest in education and training at the GCC Exhibition Al Ain.' },
];

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Extracts the first day if a range (e.g., "25 - 27 September" -> "25 September")
    const cleaned = dateStr.replace(/(\d+)\s*-\s*(\d+)/, '$1');
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function parseEventEndDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Extracts the last day if a range (e.g., "25 - 27 September" -> "27 September")
    let target = dateStr;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      const startPart = parts[0].trim();
      const endPart = parts[1].trim();
      // If endPart is just a number, combine with month/year from startPart or vice versa
      if (/^\d+$/.test(endPart)) {
        target = startPart.replace(/^\d+/, endPart);
      } else {
        target = endPart;
      }
    }
    const d = new Date(target);
    if (isNaN(d.getTime())) return null;
    // Set to end of day
    d.setHours(23, 59, 59, 999);
    return d;
  } catch { return null; }
}

function useCountdown(startDate, endDate) {
  const [countdown, setCountdown] = useState({ 
    days: 0, hours: 0, minutes: 0, seconds: 0, 
    isLive: false, isEnded: false 
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      
      // Check if ended
      if (endDate && now > endDate.getTime()) {
        setCountdown(prev => ({ ...prev, isEnded: true, isLive: false }));
        return;
      }

      // Check if live
      if (startDate && now > startDate.getTime()) {
        setCountdown(prev => ({ ...prev, isLive: true, isEnded: false }));
        return;
      }

      // Calculate upcoming
      if (!startDate) {
        setCountdown(prev => ({ ...prev, isEnded: true }));
        return;
      }

      const diff = startDate.getTime() - now;
      if (diff <= 0) {
        setCountdown(prev => ({ ...prev, isLive: true }));
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isLive: false,
        isEnded: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate, endDate]);

  return countdown;
}

function useAnimatedCounter(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!started || !target) return;
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [started, target, duration]);
  return { value, triggerStart: () => setStarted(true) };
}

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showExhibitorAdminModal, setShowExhibitorAdminModal] = useState(false);
  const [showExhibitorDetailModal, setShowExhibitorDetailModal] = useState(false);
  const [showTierSettingsModal, setShowTierSettingsModal] = useState(false);
  const [showFloorPlanBuilder, setShowFloorPlanBuilder] = useState(false);
  const [showFloorPlanViewer, setShowFloorPlanViewer] = useState(false);
  const [hasFloorPlan, setHasFloorPlan] = useState(false);
  const [floorPlanLoading, setFloorPlanLoading] = useState(true);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [exhibitors, setExhibitors] = useState([]);
  const [exhibitorsLoading, setExhibitorsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(event?.likesCount || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);

  const overviewRef = useRef(null);
  const exhibitorsRef = useRef(null);
  const scheduleRef = useRef(null);
  const commentsRef = useRef(null);
  const statsRef = useRef(null);
  const tabsRef = useRef(null);

  const [guestId] = useState(() => {
    let id = localStorage.getItem('midpoint_guest_id');
    if (!id) { id = 'guest-' + Math.random().toString(36).substr(2, 9); localStorage.setItem('midpoint_guest_id', id); }
    return id;
  });

  const eventColor = event?.eventColor || '#E31E24';
  
  const startDate = useMemo(() => parseEventDate(event?.date), [event?.date]);
  const endDate = useMemo(() => parseEventEndDate(event?.date), [event?.date]);
  const countdown = useCountdown(startDate, endDate);
  
  const schedule = useMemo(() => event?.schedule || DEFAULT_SCHEDULE, [event?.schedule]);
  const whyAttend = useMemo(() => event?.highlights || WHY_ATTEND_DEFAULTS, [event?.highlights]);

  // Stats with animated counters
  const uniqueCountries = [...new Set(exhibitors.map(e => e.country).filter(Boolean))].length;
  const statExhibitors = useAnimatedCounter(exhibitors.length || (event?.stats?.exhibitors || 0));
  const statCountries = useAnimatedCounter(uniqueCountries || (event?.stats?.countries || 0));
  const statVisitors = useAnimatedCounter(event?.stats?.visitors || 5000);

  // Intersection observer for stats animation
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        statExhibitors.triggerStart();
        statCountries.triggerStart();
        statVisitors.triggerStart();
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [exhibitors.length, event?.stats]);

  // Scroll-spy for tabs
  useEffect(() => {
    const sections = [
      { ref: overviewRef, id: 'overview' },
      { ref: exhibitorsRef, id: 'exhibitors' },
      { ref: scheduleRef, id: 'schedule' },
      { ref: commentsRef, id: 'comments' },
    ];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const s = sections.find(s => s.ref.current === entry.target);
          if (s) setActiveTab(s.id);
        }
      });
    }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });
    sections.forEach(s => { if (s.ref.current) obs.observe(s.ref.current); });
    return () => obs.disconnect();
  }, [event]);

  const scrollToSection = (id) => {
    const refs = { overview: overviewRef, exhibitors: exhibitorsRef, schedule: scheduleRef, comments: commentsRef };
    refs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab(id);
  };

  const loadEventData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await getEventBySlug(slug);
      if (data) { setEvent(data); setLikesCount(data.likesCount || 0); }
      else { const fb = fallbackEvents.find(e => e.slug === slug); if (fb) setEvent(fb); }
    } catch (err) {
      console.warn('Using fallback data:', err.message);
      const fb = fallbackEvents.find(e => e.slug === slug);
      if (fb) setEvent(fb);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (event && event.slug === slug) { setLoading(false); return; }
    loadEventData(true);
  }, [slug]);

  const fetchExhibitors = async () => {
    if (!event?.id) return;
    try { const data = await getExhibitorsByEvent(event.id); setExhibitors(data); }
    catch (err) { console.error("Failed to fetch exhibitors", err); }
    finally { setExhibitorsLoading(false); }
  };
  useEffect(() => { fetchExhibitors(); }, [event?.id]);

  const checkFloorPlan = async () => {
    if (!event?.id) return;
    setFloorPlanLoading(true);
    try { const fp = await getFloorPlan(event.id); setHasFloorPlan(!!fp && (fp.booths?.length > 0)); }
    catch (err) { console.error('Failed to check floor plan', err); }
    finally { setFloorPlanLoading(false); }
  };
  useEffect(() => { checkFloorPlan(); }, [event?.id]);

  // Filter exhibitors by search
  const filteredExhibitors = searchQuery.trim()
    ? exhibitors.filter(ex => ex.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : exhibitors;

  const groupedExhibitors = (event?.sponsorTiers || DEFAULT_TIERS).reduce((acc, tier) => {
    const list = filteredExhibitors.filter(ex => ex.sponsorType === tier.label);
    if (list.length > 0) acc.push({ type: tier.label, list, tierId: tier.id, color: tier.color });
    return acc;
  }, []);

  const getGroupTitle = (type, count) => {
    if (type.startsWith('Others')) return 'Others';
    let base = type.replace(/\/s$/, '').split(' (')[0];
    if (count > 1) {
      if (base.endsWith('Partner')) return base + 's';
      if (base.endsWith('Sponsor')) return base + 's';
      return base;
    }
    return base;
  };

  const getContrastColor = (hex) => {
    if (!hex) return '#333';
    const c = hex.startsWith('#') ? hex.slice(1) : hex;
    if (c.length !== 6) return '#333';
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? '#333' : '#fff';
  };

  // Social effects
  useEffect(() => {
    const uid = user?.uid || guestId;
    if (event?.id && uid) checkIfLiked(event.id, uid).then(setLiked);
  }, [event?.id, user?.uid, guestId]);

  useEffect(() => {
    if (event?.id) { const unsub = subscribeToComments(event.id, setComments); return () => unsub(); }
  }, [event?.id]);

  const handleLike = async () => {
    const uid = user?.uid || guestId;
    if (!uid) return;
    const prev = liked, prevC = likesCount;
    setLiked(!prev); setLikesCount(c => prev ? c - 1 : c + 1);
    try { await toggleLike(event.id, uid); }
    catch (err) { setLiked(prev); setLikesCount(prevC); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    if (!user && !guestName.trim()) { alert("Please provide your name to comment."); return; }
    setIsSubmittingComment(true);
    try {
      await addComment(event.id, {
        userId: user?.uid || guestId, userName: user?.name || guestName.trim() || 'Visitor',
        userPhoto: user?.photoURL || null, text: newComment.trim(), isGuest: !user
      });
      setNewComment('');
    } catch { alert("Failed to add comment."); }
    finally { setIsSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try { await deleteComment(commentId, event.id); } catch { alert("Failed to delete comment."); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = event?.title || 'Event';
    if (navigator.share) {
      try { await navigator.share({ title, text: `Check out ${title}!`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2500); } catch {}
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!event) return <div className="error-state">Event not found.</div>;


  return (
    <div className="event-detail-page">
      
      {/* ═══ HERO BANNER ═══ */}
      <div className="hub-hero">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back"><ChevronLeft size={24} /></button>
        
        {/* Countdown Timer */}
        <div className="countdown-overlay">
          {countdown.isEnded ? (
            <div className="countdown-ended" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <CalendarClock size={16} /> Event Ended
            </div>
          ) : countdown.isLive ? (
            <div className="countdown-ended" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <div className="live-dot" style={{ background: '#4ADE80' }} /> Event Started
            </div>
          ) : (
            <>
              <div className="countdown-digit-card"><span className="countdown-number">{String(countdown.days).padStart(2,'0')}</span><span className="countdown-label">Days</span></div>
              <span className="countdown-separator">:</span>
              <div className="countdown-digit-card"><span className="countdown-number">{String(countdown.hours).padStart(2,'0')}</span><span className="countdown-label">Hours</span></div>
              <span className="countdown-separator">:</span>
              <div className="countdown-digit-card"><span className="countdown-number">{String(countdown.minutes).padStart(2,'0')}</span><span className="countdown-label">Min</span></div>
              <span className="countdown-separator">:</span>
              <div className="countdown-digit-card"><span className="countdown-number">{String(countdown.seconds).padStart(2,'0')}</span><span className="countdown-label">Sec</span></div>
            </>
          )}
        </div>

        {event.mediaUrl || event.image ? (
          <img src={event.mediaUrl || event.image} alt={event.title} className="hub-hero-img" />
        ) : (
          <PlaceholderImage height="100%" label={event.title} />
        )}
        <div className="hub-hero-gradient" />
        <div className="hub-hero-content">
          {event.language && <span className="hub-hero-badge" style={{ backgroundColor: eventColor }}>{event.language}</span>}
          <h1 className="hub-hero-title">{event.title}</h1>
          <div className="hub-hero-meta">
            <div className="hub-meta-pill"><Calendar size={14} /> {event.date}</div>
            <div className="hub-meta-pill"><MapPin size={14} /> {event.location}</div>
            {event.eventTime && <div className="hub-meta-pill"><Clock size={14} /> {event.eventTime}</div>}
          </div>
        </div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div className="hub-stats-bar-wrapper" ref={statsRef}>
        <div className="hub-stats-bar">
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><GraduationCap size={18} color={eventColor} /></div>
            <div className="hub-stat-number">{statExhibitors.value}+</div>
            <div className="hub-stat-label">Exhibitors</div>
          </div>
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><Globe size={18} color={eventColor} /></div>
            <div className="hub-stat-number">{statCountries.value}+</div>
            <div className="hub-stat-label">Countries</div>
          </div>
          <div className="hub-stat-card">
            <div className="hub-stat-icon"><Users size={18} color={eventColor} /></div>
            <div className="hub-stat-number">{statVisitors.value > 999 ? `${(statVisitors.value / 1000).toFixed(0)}K` : statVisitors.value}+</div>
            <div className="hub-stat-label">Visitors</div>
          </div>
        </div>
      </div>

      {/* ═══ STICKY TABS ═══ */}
      <div className="hub-tabs-wrapper" ref={tabsRef}>
        <div className="hub-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <Compass size={15} /> },
            { id: 'exhibitors', label: 'Exhibitors', icon: <GraduationCap size={15} />, count: exhibitors.length },
            { id: 'schedule', label: 'Schedule', icon: <CalendarClock size={15} /> },
            { id: 'comments', label: 'Comments', icon: <MessageCircle size={15} />, count: comments.length },
          ].map(tab => (
            <button key={tab.id} className={`hub-tab ${activeTab === tab.id ? 'active' : ''}`}
              style={{ '--active-color': eventColor }}
              onClick={() => scrollToSection(tab.id)}>
              {tab.icon} {tab.label}
              {tab.count > 0 && <span className="hub-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div className="hub-content-area">

        {/* ── OVERVIEW SECTION ── */}
        <div className="hub-section" ref={overviewRef} id="section-overview">
          <h2 className="hub-section-title"><Compass size={20} className="title-icon" /> About This Event</h2>
          <div className="hub-description">
            {event.description ? event.description.split('\n').map((line, i) => <p key={i}>{line}</p>) : <p>No description available.</p>}
          </div>

          <h3 className="hub-section-title" style={{ fontSize: '1.1rem' }}>Why Attend?</h3>
          <div className="why-attend-grid">
            {whyAttend.map((item, i) => (
              <div key={i} className="why-card">
                <div className="why-card-icon" style={{ background: item.bg || '#f0f0f0' }}>{item.icon}</div>
                <div className="why-card-title">{item.title}</div>
                <div className="why-card-desc">{item.desc || item.description}</div>
              </div>
            ))}
          </div>

          <div className="hub-quick-actions">
            {hasFloorPlan && (
              <button className="hub-action-btn" style={{ background: eventColor }} onClick={() => setShowFloorPlanViewer(true)}>
                <Grid3X3 size={16} /> View Floor Plan
              </button>
            )}
            <button className="hub-action-btn secondary" onClick={() => setShowRegisterModal(true)}>
              <User size={16} /> Register Now
            </button>
          </div>
        </div>

        {/* ── EXHIBITORS SECTION ── */}
        <div className="hub-section" ref={exhibitorsRef} id="section-exhibitors">
          <h2 className="hub-section-title"><GraduationCap size={20} className="title-icon" /> Exhibitors</h2>

          {isAdmin && (
            <div className="admin-manage-exhibitors">
              <div className="admin-manage-title"><User size={18} /><span>Admin: Manage Exhibitors</span></div>
              <div className="admin-action-btns">
                <button className="btn-admin-add" onClick={() => { setSelectedExhibitor(null); setShowExhibitorAdminModal(true); }}><Send size={14} /><span>Add</span></button>
                <button className="btn-admin-add" onClick={() => setShowTierSettingsModal(true)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}><Settings size={14} /><span>Tiers</span></button>
                <button className="btn-admin-add" onClick={() => setShowFloorPlanBuilder(true)} style={{ background: '#f0f4ff', color: '#3B82F6', border: '1px solid #dbeafe' }}><Grid3X3 size={14} /><span>Floor Plan</span></button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          {exhibitors.length > 0 && (
            <div className="exhibitor-search-wrapper">
              <Search size={18} className="exhibitor-search-icon" />
              <input type="text" className="exhibitor-search-input" placeholder="Search exhibitors by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ '--event-color': eventColor }} />
              {searchQuery && <div className="search-result-count">{filteredExhibitors.length} of {exhibitors.length} exhibitors</div>}
            </div>
          )}

          <div className="exhibitors-section" style={(event?.sponsorTiers || DEFAULT_TIERS).reduce((acc, tier) => { acc[`--tier-${tier.id}-color`] = tier.color; return acc; }, {})}>
            {exhibitorsLoading ? (
              <div className="loading-spinner-container">
                <div className="loading-spinner" style={{ borderTopColor: eventColor }} />
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Loading Exhibitors...</p>
              </div>
            ) : groupedExhibitors.length > 0 ? (
              groupedExhibitors.map((group, gIdx) => (
                <div key={gIdx} className="exhibitors-group">
                  <h3 className="group-header">{getGroupTitle(group.type, group.list.length)}<span className="group-count">({group.list.length})</span></h3>
                  <div className="exhibitors-grid">
                    {group.list.map(ex => (
                      <div key={ex.id} className="exhibitor-card"
                        style={{ '--event-color': eventColor, '--tier-color': group.color, '--tier-text-color': getContrastColor(group.color) }}
                        onClick={() => {
                          if (isAdmin && window.confirm("Edit this exhibitor? (Cancel to just view)")) {
                            setSelectedExhibitor(ex); setShowExhibitorAdminModal(true);
                          } else { setSelectedExhibitor(ex); setShowExhibitorDetailModal(true); }
                        }}>
                        <div className="exhibitor-logo-container"><img src={ex.logo} alt={ex.name} className="exhibitor-logo" /></div>
                        <div className="exhibitor-name-tag">{ex.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments" style={{ textAlign: 'center', padding: '20px' }}>
                {searchQuery ? 'No exhibitors match your search.' : 'Exhibitors list will be updated soon.'}
              </p>
            )}
          </div>
        </div>

        {/* ── SCHEDULE SECTION ── */}
        <div className="hub-section" ref={scheduleRef} id="section-schedule">
          <h2 className="hub-section-title"><CalendarClock size={20} className="title-icon" /> Event Schedule</h2>
          {schedule.length > 0 ? (
            <div className="schedule-timeline">
              {schedule.map((item, i) => (
                <div key={i} className="schedule-item">
                  <div className="schedule-dot" style={{ background: eventColor }} />
                  <div className="schedule-time">{item.time}</div>
                  <div className="schedule-card">
                    <div className="schedule-card-header">
                      <span className="schedule-card-title">{item.title}</span>
                      {item.type && <span className={`schedule-type-badge ${item.type.toLowerCase()}`}>{item.type}</span>}
                    </div>
                    {item.description && <p className="schedule-card-desc">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="schedule-empty-state">
              <div className="schedule-empty-icon"><CalendarClock size={32} /></div>
              <div className="schedule-empty-title">Schedule Coming Soon</div>
              <p className="schedule-empty-text">The event schedule will be announced shortly. Stay tuned for exciting sessions and workshops!</p>
            </div>
          )}
        </div>

        {/* ── COMMENTS SECTION ── */}
        <div className="hub-section" ref={commentsRef} id="section-comments" style={{ paddingBottom: '100px' }}>
          <h2 className="hub-section-title"><MessageCircle size={20} className="title-icon" /> Comments ({comments.length})</h2>
          <form className="comment-form" onSubmit={handleComment}>
            {!user && <input type="text" placeholder="Your Name" className="guest-name-input" value={guestName} onChange={e => setGuestName(e.target.value)} required />}
            <div className="comment-input-row">
              <input type="text" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} disabled={isSubmittingComment} />
              <button type="submit" disabled={!newComment.trim() || isSubmittingComment}><Send size={18} /></button>
            </div>
          </form>
          <div className="comments-list">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {comment.userPhoto ? <img src={comment.userPhoto} alt={comment.userName} /> : <div className="avatar-placeholder">{comment.userName?.charAt(0)}</div>}
                </div>
                <div className="comment-body">
                  <div className="comment-user-row">
                    <span className="comment-username">{comment.userName}</span>
                    <div className="comment-meta-actions">
                      <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {(user?.uid === comment.userId || guestId === comment.userId || user?.email === 'admin@midpoint.ae') && (
                        <button className="comment-delete-btn" onClick={() => handleDeleteComment(comment.id)} aria-label="Delete comment"><Trash size={14} /></button>
                      )}
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            )) : <p className="no-comments">No comments yet. Be the first to join the conversation!</p>}
          </div>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM CTA ═══ */}
      <div className="hub-sticky-cta">
        <div className="cta-social-btns">
          <button className={`cta-icon-btn ${liked ? 'liked' : ''}`} onClick={handleLike} style={liked ? { background: eventColor, borderColor: eventColor } : {}}>
            <Heart size={20} fill={liked ? 'white' : 'transparent'} />
          </button>
          <button className="cta-icon-btn" onClick={handleShare}><Share2 size={20} /></button>
        </div>
        <button className="cta-register-btn" style={{ background: eventColor }} onClick={() => setShowRegisterModal(true)}>
          <User size={16} /> Register for Free
        </button>
      </div>

      {/* Share Toast */}
      <div className={`share-toast ${showShareToast ? 'visible' : ''}`}><Check size={16} /> Link copied to clipboard!</div>

      {/* ═══ MODALS ═══ */}
      <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} event={event} />
      <EnquiryModal isOpen={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} event={event} />
      <ExhibitorAdminModal isOpen={showExhibitorAdminModal} onClose={() => setShowExhibitorAdminModal(false)} eventId={event?.id} exhibitor={selectedExhibitor} onSaved={fetchExhibitors} sponsorTiers={event?.sponsorTiers} />
      <ExhibitorDetailModal isOpen={showExhibitorDetailModal} onClose={() => setShowExhibitorDetailModal(false)} exhibitor={selectedExhibitor} eventColor={eventColor} />
      <TierSettingsModal isOpen={showTierSettingsModal} onClose={() => setShowTierSettingsModal(false)} event={event} onSaved={loadEventData} />
      <FloorPlanBuilder isOpen={showFloorPlanBuilder} onClose={() => setShowFloorPlanBuilder(false)} eventId={event?.id} exhibitors={exhibitors} sponsorTiers={event?.sponsorTiers || DEFAULT_TIERS} onSaved={checkFloorPlan} />
      <FloorPlanViewer isOpen={showFloorPlanViewer} onClose={() => setShowFloorPlanViewer(false)} eventId={event?.id} sponsorTiers={event?.sponsorTiers || DEFAULT_TIERS} event={event} exhibitors={exhibitors} />
    </div>
  );
}
