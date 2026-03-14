import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Calendar, MapPin, ChevronLeft, ChevronRight, GraduationCap, Globe, Users, Presentation, CalendarCheck, Megaphone, Play, Heart, MessageCircle } from 'lucide-react';
import { getBanners, getAboutText } from '../firebase/firestore';
import PlaceholderImage from '../components/PlaceholderImage';

// Fallback data removed - now using dynamic banners from Admin Dashboard

const fallbackPreviousEvents = [
  {
    id: 'gcc-exhibition-2023',
    slug: 'gcc-exhibition-2023',
    title: 'GCC Exhibition 2023',
    language: 'English / Arabic',
    date: '10 - 12 October 2023',
    location: 'ADNEC, Abu Dhabi, UAE',
    image: '/events/gcc-exhibition-2024.png', // Temporary reuse
  },
  {
    id: 'iue-dubai-2023',
    slug: 'iue-dubai-2023',
    title: 'International University Expo Dubai',
    language: 'English',
    date: 'March 2023',
    location: 'World Trade Center, Dubai',
    image: '/events/iue-riyadh.png', // Temporary reuse
  },
  {
    id: 'edu-tech-2023',
    slug: 'edu-tech-2023',
    title: 'EduTech Middle East',
    language: 'English / Arabic',
    date: 'May 2023',
    location: 'Riyadh, KSA',
    image: '/events/gcc-exhibition-rak.png', // Temporary reuse
  },
  {
    id: 'career-fair-2023',
    slug: 'career-fair-2023',
    title: 'National Career Fair',
    language: 'Arabic / English',
    date: 'November 2023',
    location: 'Expo Centre Sharjah, UAE',
    image: '/events/gcc-al-ain.png', // Temporary reuse
  },
];



const solutionsData = [
  {
    icon: <GraduationCap size={28} />,
    title: 'Educational & Training Exhibitions',
    description: 'World-class exhibitions connecting students with top universities and training institutions from around the globe'
  },
  {
    icon: <Globe size={28} />,
    title: 'International University Expos',
    description: 'Prestigious platforms showcasing international higher education opportunities to GCC students and families'
  },
  {
    icon: <Users size={28} />,
    title: 'Conferences & Forums',
    description: 'High-level forums bringing together ministers, policymakers, and education leaders to shape the future'
  },
  {
    icon: <Presentation size={28} />,
    title: 'Professional Training Programs',
    description: 'Seminars and workshops delivered by international experts on leadership, communication, and business excellence'
  },
  {
    icon: <CalendarCheck size={28} />,
    title: 'Event Management & Production',
    description: 'End-to-end event planning, execution, and production services ensuring flawless delivery'
  },
  {
    icon: <Megaphone size={28} />,
    title: 'Advertising & Media Activities',
    description: 'Strategic branding, advertising campaigns, and media partnerships amplifying event reach and impact'
  }
];

const fallbackAbout = {
  title: 'CONNECTING EDUCATION COMMUNITIES THROUGH PREMIER EVENTS',
  body: 'Midpoint Events is an Exhibition Organizer which specialises in Education Events & Hosting highly beneficial International Exhibitors of great repute. Midpoint strives to exceed the expectations of its clients by bringing together concepts and hosting prestigious events that educate & entertain its clients while promoting and supporting the Higher Education.',
};

/* ── Drag-to-scroll hook ── */
function useDragScroll() {
  const ref = useRef(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e) => {
    const el = ref.current;
    state.current.isDown = true;
    state.current.startX = e.pageX - el.offsetLeft;
    state.current.scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onMouseLeave = () => {
    state.current.isDown = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  };

  const onMouseUp = () => {
    state.current.isDown = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  };

  const onMouseMove = (e) => {
    if (!state.current.isDown) return;
    e.preventDefault();
    const el = ref.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - state.current.startX) * 1.5;
    el.scrollLeft = state.current.scrollLeft - walk;
  };

  return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
}

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [about, setAbout] = useState(fallbackAbout);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const eventsDrag = useDragScroll();
  const carouselRef = eventsDrag.ref;

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (index !== activeEventIndex && index >= 0 && index < banners.length) {
        setActiveEventIndex(index);
      }
    }
  };

  const scrollToEvent = (index) => {
    const wrappedIndex = ((index % banners.length) + banners.length) % banners.length;
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: wrappedIndex * carouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  // Auto-advance carousel every 5 seconds, infinite loop
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveEventIndex(prev => {
        const next = (prev + 1) % banners.length;
        scrollToEvent(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [b, ab] = await Promise.all([
          getBanners(), getAboutText(),
        ]);
        if (cancelled) return;
        if (b.length) setBanners(b);
        if (ab) setAbout(ab);
      } catch (err) {
        if (cancelled) return;
        console.warn('Using fallback data:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    let stars = '';
    for (let i = 0; i < full; i++) stars += '★';
    if (rating % 1 >= 0.5) stars += '★';
    return stars;
  };

  return (
    <div className="home-page" id="home-page">

      {/* ── Tagline Hero ── */}
      <section className="tagline-hero-section">
        <img src="/logos/Midpoint.svg" alt="Midpoint" className="tagline-hero-logo" />
        <div className="tagline-hero-content">
          <h1 className="tagline-main">CONNECTING PEOPLE TOGETHER</h1>
          <p className="tagline-sub">Leading events and exhibitions organizer connecting education, opportunity, and excellence across the GCC region</p>
        </div>
      </section>

      {/* ── Upcoming Events — Fullscreen Banner Style ── */}
      {(!loading && banners.length > 0) && (
        <section className="app-section events-carousel-section">
          <h2 className="section-title-app">Upcoming Events</h2>
          <div className="events-carousel-wrapper">
          {/* Left arrow — desktop only */}
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={() => scrollToEvent(activeEventIndex - 1)}
            aria-label="Previous banner"
            disabled={banners.length <= 1}
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="events-carousel hide-scrollbar"
            ref={carouselRef}
            onMouseDown={eventsDrag.onMouseDown}
            onMouseLeave={eventsDrag.onMouseLeave}
            onMouseUp={eventsDrag.onMouseUp}
            onMouseMove={eventsDrag.onMouseMove}
            onScroll={handleScroll}
            style={{ cursor: 'grab' }}
          >
            {banners.map((banner, index) => (
              <div key={banner.id} className={`event-carousel-card ${index === activeEventIndex ? 'active' : ''}`}>
                  <div 
                    className="event-banner-inner" 
                    onClick={() => {
                      // Generate a simple slug if not present (banners from admin might not have one)
                      const slug = banner.slug || banner.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      navigate(`/event/${slug}`, { state: { event: { ...banner, slug } } });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                  <div className="app-event-header">
                    <span 
                      className="app-event-badge"
                      style={{ backgroundColor: banner.eventColor || 'var(--color-primary)' }}
                    >
                      {banner.language}
                    </span>
                  </div>

                  <h3 className="app-event-title">{banner.title}</h3>

                  <div className="app-event-info">
                    <div className="app-event-info-item">
                      <Calendar 
                        size={14} 
                        className="info-icon" 
                        style={{ color: banner.eventColor || 'var(--color-primary-light)' }} 
                      />
                      <span>{banner.date}</span>
                    </div>
                    <div className="app-event-info-item">
                      <MapPin 
                        size={14} 
                        className="info-icon"
                        style={{ color: banner.eventColor || 'var(--color-primary-light)' }}
                      />
                      <span>{banner.location}</span>
                    </div>
                  </div>

                  {/* Social Stats */}
                  <div className="app-event-social-stats">
                    <div className="social-stat-item">
                      <Heart 
                        size={12} 
                        fill={banner.likesCount > 0 ? (banner.eventColor || 'var(--color-primary)') : 'transparent'} 
                        style={{ color: banner.likesCount > 0 ? (banner.eventColor || 'var(--color-primary)') : '#ccc' }}
                      />
                      <span>{banner.likesCount || 0}</span>
                    </div>
                    <div className="social-stat-item">
                      <MessageCircle size={12} style={{ color: '#ccc' }} />
                      <span>{banner.commentsCount || 0}</span>
                    </div>
                  </div>

                  {banner.mediaUrl ? (
                    banner.mediaType === 'image' ? (
                      <img src={banner.mediaUrl} alt={banner.title} className="app-event-image" />
                    ) : (
                      <div className="app-event-video-container">
                        <video 
                          src={banner.mediaUrl} 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                          className="app-event-video"
                        />
                        <div className="video-overlay-gradient"></div>
                      </div>
                    )
                  ) : (
                    <PlaceholderImage height="140px" label="Event Image" style={{ borderRadius: '12px' }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow — desktop only */}
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={() => scrollToEvent(activeEventIndex + 1)}
            aria-label="Next banner"
            disabled={banners.length <= 1}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Carousel dots */}
        <div className="app-carousel-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`app-dot ${i === activeEventIndex ? 'active' : ''}`}
              onClick={() => scrollToEvent(i)}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      </section>
      )}

      {/* ── About ── */}
      <section className="app-section about-section">
        <h2 className="section-title-app">{about.title}</h2>
        <div className="about-content">
          <p>{about.body}</p>
        </div>
      </section>

      {/* ── Comprehensive Event Solutions Infographic ── */}
      <section className="solutions-infographic-section">
        <div className="solutions-bg-circles">
           <div className="circle circle-1"></div>
           <div className="circle circle-2"></div>
           <div className="circle circle-3"></div>
           <div className="circle circle-4"></div>
        </div>
        <div className="solutions-container">
          <div className="solutions-header">
            <h2 className="solutions-main-title">COMPREHENSIVE EVENT SOLUTIONS</h2>
            <div className="solutions-logo-corner">
              <img src="/logos/midpoint-events-horizontal.svg" alt="Midpoint Logo" className="solutions-logo-img" />
            </div>
          </div>

          <div className="solutions-grid">
            {solutionsData.map((item, idx) => (
              <div key={idx} className="solution-item">
                <div className="solution-icon-wrapper">
                  {item.icon}
                </div>
                <div className="solution-text">
                  <h3 className="solution-title">{item.title}</h3>
                  <p className="solution-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Previous Events — Grid List ── */}
      <section className="app-section previous-events-section">
        <h2 className="section-title-app">Previous Events</h2>
        <div className="previous-events-grid">
          {fallbackPreviousEvents.map(event => (
            <div 
              key={event.id} 
              className="previous-event-card"
              onClick={() => navigate(`/event/${event.slug}`, { state: { event } })}
            >
              <div className="previous-event-image-container">
                <img src={event.image} alt={event.title} className="previous-event-image" />
                <div className="previous-event-overlay">
                  <ArrowUpRight size={20} color="white" />
                </div>
              </div>
              <div className="previous-event-details">
                <h3 className="previous-event-title">{event.title}</h3>
                <div className="previous-event-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{event.date}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
