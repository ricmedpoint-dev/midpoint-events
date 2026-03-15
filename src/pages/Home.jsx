import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Calendar, MapPin, ChevronLeft, ChevronRight, GraduationCap, Globe, Users, Presentation, CalendarCheck, Megaphone, Play, Heart, MessageCircle } from 'lucide-react';
import { getBanners, getAboutText } from '../firebase/firestore';
import PlaceholderImage from '../components/PlaceholderImage';

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

const groupedPreviousEvents = [
  {
    id: 'gcc-exhibition',
    title: 'GCC Exhibition',
    summary: 'Connecting education, opportunity, and excellence across the GCC region.',
    events: [
      {
        city: 'Abu Dhabi',
        editions: [
          { year: '2025', edition: '4', location: 'Etihad Arena', stats: '120+ institutions | 9,000+ students', details: 'Our largest edition in Abu Dhabi\'s premier venue' },
          { year: '2024', edition: '3', location: 'Manarat, Al Saadiyat', stats: '70 exhibitors | 8,000+ attendees', details: 'Expanded reach with prestigious cultural venue' },
          { year: '2023', edition: '2', location: 'Erth Hotel', stats: '40 universities | 6,000+ attendees', details: 'Doubled participation with enhanced programming' },
          { year: '2022', edition: '1', location: 'Park Rotana Hotel', stats: '20 universities | 20,000 attendees', details: 'Inaugural edition establishing strong market presence' }
        ],
        officialSupport: 'Ministry of Education – UAE and Abu Dhabi Convention and Exhibition Bureau Partner'
      },
      {
        city: 'Ras Al Khaimah',
        date: '28-29 Oct 2025',
        location: 'RAK Exhibition Center',
        inauguratedBy: 'Sheikh Saqr Bin Saud Bin Saqr Al Qasimi',
        inauguratedTitle: 'Chairman of RAK Ceramics',
        stats: [
          '50+ participating institutions',
          '4,000+ student attendees',
          'Support from RAK Department of Knowledge and RAK Chamber of Commerce & Industry'
        ]
      },
      {
        city: 'Al Ain',
        date: '28-29 Apr 2025',
        location: 'ADNEC Al Ain',
        partnershipWith: 'Abu Dhabi Convention & Exhibition Bureau',
        stats: [
          '36 participating institutions',
          '3,000+ attendees from across the UAE',
          'Partnership with Destination Culture & Tourism'
        ]
      }
    ]
  },
  {
    id: 'iue',
    title: 'International University Expo',
    summary: 'Global higher education opportunities brought to the doorstep of prospective students.',
    events: [
      {
        city: 'Riyadh',
        editions: [
          { 
            year: '2025', 
            edition: '2', 
            location: 'Makarim Convention Center', 
            date: 'January 2025',
            stats: '41 exhibitors | 5,000+ visitors', 
            details: 'Expanded partnerships — Growing our footprint with enhanced venue and increased attendance' 
          },
          { 
            year: '2024', 
            edition: '1', 
            location: 'Makarim Convention Center', 
            date: 'January 2024',
            stats: '45+ universities from around the world | 3,000+ visitors', 
            details: 'Licensed by local authorities — Established strong presence in the Kingdom\'s capital' 
          }
        ],
        summary: 'Our Riyadh expos provide Saudi students and families direct access to prestigious international universities, with full support and licensing from local authorities.'
      }
    ]
  },
  {
    id: 'btraining',
    title: 'BTraining',
    summary: 'Bahrain Exhibition for Training & Education Pre-Employment.',
    events: [
      {
        city: 'Kingdom of Bahrain',
        title: 'Bahrain Exhibition for Training & Education Pre-Employment',
        patronage: 'Under the Patronage of the Minister of Labour, H.E Jameel Bin Mohammed Ali Humaidan',
        partnership: 'In Partnership with Ministry of Education Bahrain',
        history: 'Held for more than 13 years in a row, supporting job seekers and students on the verge of graduation.',
        stats: 'Participation from more than 50 reputed Colleges, Universities and Training Institutes',
        timeline: ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012']
      }
    ]
  },
  {
    id: 'u195',
    title: 'Universities 195',
    summary: 'Landmark Global Events connecting higher education institutions worldwide.',
    events: [
      {
        city: 'Global Virtual Conference',
        date: 'December 2021',
        details: '6-Day Virtual Event',
        stats: [
          '195 universities and institutes worldwide',
          '69 international speakers',
          '11 Ministers of Education',
          '20 Undersecretaries',
          '85,000 attendees globally'
        ]
      }
    ]
  },
  {
    id: 'formal-edu',
    title: '100 Years of Formal Education Forum',
    summary: 'Celebrating a century of educational excellence in the region.',
    events: [
      {
        city: 'Kingdom of Bahrain',
        year: '2019',
        stats: [
          'Focus on global education development and policy',
          'High-level government participation',
          'International education leaders and policymakers'
        ]
      }
    ]
  }
];

const academicPartners = [
  '/images/partners/partners-1.png',
  '/images/partners/partners-2.png',
  '/images/partners/partners-3.png',
  '/images/partners/partners-4.png',
];

function EventAccordion({ group }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`event-accordion-group ${isOpen ? 'is-open' : ''}`}>
      <button 
        className="accordion-header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="header-info">
          <h3 className="group-title">{group.title}</h3>
          <p className="group-summary">{group.summary}</p>
        </div>
        <div className="accordion-icon">
          <ChevronRight size={20} className={isOpen ? 'rotate-90' : ''} />
        </div>
      </button>

      <div className="accordion-content">
        <div className="accordion-content-inner">
          {group.events.length > 0 ? (
            <div className="nested-events-list">
              {group.events.map((event, idx) => (
                <div key={idx} className="nested-event-card">
                  <div className="nested-event-header">
                    <h4>{event.city || event.title}</h4>
                    {event.date && <span className="event-date-tag">{event.date}</span>}
                    {event.year && <span className="event-date-tag">{event.year}</span>}
                  </div>
                  
                  {/* Summary for groups like Riyadh Expo */}
                  {event.summary && <p className="event-group-summary-text">{event.summary}</p>}

                  {/* Patronage & Partnership (e.g. BTraining) */}
                  {(event.patronage || event.partnership) && (
                    <div className="event-patronage-box">
                      {event.patronage && <p className="patronage-text">{event.patronage}</p>}
                      {event.partnership && <p className="partnership-text">{event.partnership}</p>}
                    </div>
                  )}

                  {/* History/Introduction text */}
                  {event.history && <p className="event-history-intro">{event.history}</p>}

                  {/* Timeline Grid (e.g. BTraining) */}
                  {event.timeline && (
                    <div className="event-timeline-grid">
                      {event.timeline.map((year, yIdx) => (
                        <div key={yIdx} className={`timeline-year-chip ${yIdx % 2 === 0 ? 'even' : 'odd'}`}>
                          {year}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {event.editions ? (
                    <div className="editions-list">
                      {event.editions.map((ed, edIdx) => (
                        <div key={edIdx} className="edition-row">
                          <div className="edition-badge">
                            <span className="ed-label">EDITION</span>
                            <span className="ed-num">{ed.edition}</span>
                          </div>
                          <div className="edition-main">
                            <div className="ed-top">
                              <span className="ed-year">{ed.year}</span>
                              <span className="ed-location">{ed.location}</span>
                            </div>
                            {ed.date && <p className="ed-date-sub">{ed.date}</p>}
                            <p className="ed-stats">{ed.stats}</p>
                            <p className="ed-details">{ed.details}</p>
                          </div>
                        </div>
                      ))}
                      {event.officialSupport && (
                        <div className="official-support">
                          <strong>Official Support:</strong> {event.officialSupport}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="event-simple-details">
                      {(event.location || event.details) && (
                        <div className="detail-row">
                          <MapPin size={14} />
                          <span>{event.location || event.details}</span>
                        </div>
                      )}
                      {event.inauguratedBy && (
                        <div className="inauguration-badge">
                          <span className="in-label">Inaugurated by:</span>
                          <span className="in-name">{event.inauguratedBy}</span>
                          <span className="in-title">{event.inauguratedTitle}</span>
                        </div>
                      )}
                      
                      {event.stats && Array.isArray(event.stats) && (
                        <ul className="stats-list">
                          {event.stats.map((stat, sIdx) => (
                            <li key={sIdx}>{stat}</li>
                          ))}
                        </ul>
                      )}

                      {event.stats && typeof event.stats === 'string' && (
                        <p className="simple-stats-text">{event.stats}</p>
                      )}

                      {event.partnershipWith && (
                        <div className="partnership-tag">
                          In Partnership with <strong>{event.partnershipWith}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-group-message">
              <p>Details for this group will be added soon. Stay tuned!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [about, setAbout] = useState(fallbackAbout);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [activePartnerIndex, setActivePartnerIndex] = useState(0);
  
  const eventsDrag = useDragScroll();
  const carouselRef = eventsDrag.ref;
  
  const partnersDrag = useDragScroll();
  const partnersCarouselRef = partnersDrag.ref;

  const handlePartnerScroll = () => {
    if (partnersCarouselRef.current) {
      const scrollLeft = partnersCarouselRef.current.scrollLeft;
      const width = partnersCarouselRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (index !== activePartnerIndex && index >= 0 && index < academicPartners.length) {
        setActivePartnerIndex(index);
      }
    }
  };

  const scrollToPartner = (index) => {
    const wrappedIndex = ((index % academicPartners.length) + academicPartners.length) % academicPartners.length;
    if (partnersCarouselRef.current) {
      partnersCarouselRef.current.scrollTo({
        left: wrappedIndex * partnersCarouselRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

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
                      <div className="icon-circle">
                        <Calendar 
                          size={14} 
                          className="info-icon" 
                          style={{ color: 'white' }} 
                        />
                      </div>
                      <span>{banner.date}</span>
                    </div>
                    <div className="app-event-info-item">
                      <div className="icon-circle">
                        <MapPin 
                          size={14} 
                          className="info-icon"
                          style={{ color: 'white' }}
                        />
                      </div>
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

      {/* ── Previous Events — Grouped Accordions ── */}
      <section className="app-section previous-events-section">
        <h2 className="section-title-app">Previous Events</h2>
        <div className="previous-events-accordions">
          {groupedPreviousEvents.map(group => (
            <EventAccordion key={group.id} group={group} />
          ))}
        </div>
      </section>

      {/* ── Academic Partners Slider ── */}
      <section className="app-section academic-partners-section">
        <h2 className="section-title-app">Academic Partners</h2>
        <div className="partners-slider-container">
          <div 
            className="partners-carousel hide-scrollbar"
            ref={partnersCarouselRef}
            onMouseDown={partnersDrag.onMouseDown}
            onMouseLeave={partnersDrag.onMouseLeave}
            onMouseUp={partnersDrag.onMouseUp}
            onMouseMove={partnersDrag.onMouseMove}
            onScroll={handlePartnerScroll}
            style={{ cursor: 'grab' }}
          >
            {academicPartners.map((src, idx) => (
              <div key={idx} className="partner-slide">
                <img src={src} alt={`Academic Partners ${idx + 1}`} className="partner-screenshot" />
              </div>
            ))}
          </div>
          
          {/* Slider dots */}
          <div className="partner-slider-dots">
            {academicPartners.map((_, i) => (
              <button
                key={i}
                className={`partner-dot ${i === activePartnerIndex ? 'active' : ''}`}
                onClick={() => scrollToPartner(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
