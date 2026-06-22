import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Globe, Search, CalendarClock } from 'lucide-react';
import { getEvents, getBanners } from '../firebase/firestore';
import PlaceholderImage from '../components/PlaceholderImage';

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  try {
    const cleaned = dateStr.replace(/(\d+)\s*-\s*(\d+)/, '$1');
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function parseEventEndDate(dateStr) {
  if (!dateStr) return null;
  try {
    let target = dateStr;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      const startPart = parts[0].trim();
      const endPart = parts[1].trim();
      if (/^\d+$/.test(endPart)) {
        target = startPart.replace(/^\d+/, endPart);
      } else {
        target = endPart;
      }
    }
    const d = new Date(target);
    if (isNaN(d.getTime())) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  } catch { return null; }
}

function isEventFinished(event) {
  let end = null;
  if (event.endDate) {
    end = new Date(event.endDate);
  }
  if (!end || isNaN(end.getTime())) {
    end = parseEventEndDate(event.date);
  }
  
  if (!end || isNaN(end.getTime())) {
    let start = null;
    if (event.startDate) {
      start = new Date(event.startDate);
    } else {
      start = parseEventDate(event.date);
    }
    if (start && !isNaN(start.getTime())) {
      return start.getTime() < new Date().getTime();
    }
    return false;
  }
  
  return new Date().getTime() > end.getTime();
}

function getEventYear(event) {
  let dateObj = null;
  if (event.startDate) {
    dateObj = new Date(event.startDate);
  }
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = parseEventDate(event.date);
  }
  
  if (dateObj && !isNaN(dateObj.getTime())) {
    return dateObj.getFullYear();
  }
  
  if (event.date) {
    const match = event.date.match(/\b(20\d{2})\b/);
    if (match) return parseInt(match[1]);
  }
  
  return new Date().getFullYear();
}

function getEventSortDate(event) {
  let dateObj = null;
  if (event.startDate) {
    dateObj = new Date(event.startDate);
  }
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = parseEventDate(event.date);
  }
  return dateObj ? dateObj.getTime() : 0;
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAllEvents() {
      try {
        const [fbEvents, fbBanners] = await Promise.all([
          getEvents(),
          getBanners()
        ]);
        
        // Merge and deduplicate by slug or ID
        const merged = [...fbEvents, ...fbBanners];
        const uniqueEvents = [];
        const seenIds = new Set();
        
        for (const item of merged) {
          const identifier = item.slug || item.id;
          if (identifier && !seenIds.has(identifier)) {
            seenIds.add(identifier);
            uniqueEvents.push(item);
          }
        }
        
        setEvents(uniqueEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadAllEvents();
  }, []);

  // Process, filter, group, and sort events
  const processedEvents = useMemo(() => {
    // 1. Map events with additional parsed details
    const mapped = events.map(e => {
      const year = getEventYear(e);
      const sortDate = getEventSortDate(e);
      const finished = isEventFinished(e);
      const generatedSlug = e.slug || e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return {
        ...e,
        year,
        sortDate,
        finished,
        slug: generatedSlug
      };
    });

    // 2. Filter by search query
    const filtered = mapped.filter(e => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        e.title.toLowerCase().includes(query) || 
        (e.location && e.location.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query));
        
      const matchesYear = selectedYearFilter === 'All' || String(e.year) === selectedYearFilter;
      
      return matchesSearch && matchesYear;
    });

    // 3. Group by year (separating upcoming and ended events)
    const groups = {};
    filtered.forEach(e => {
      if (!groups[e.year]) {
        groups[e.year] = { upcoming: [], ended: [] };
      }
      if (e.finished) {
        groups[e.year].ended.push(e);
      } else {
        groups[e.year].upcoming.push(e);
      }
    });

    // 4. Sort events within each year group chronologically (earliest to latest)
    Object.keys(groups).forEach(yr => {
      groups[yr].upcoming.sort((a, b) => a.sortDate - b.sortDate);
      groups[yr].ended.sort((a, b) => a.sortDate - b.sortDate);
    });

    return groups;
  }, [events, searchQuery, selectedYearFilter]);

  // Extract list of all unique years for the filter chips
  const uniqueYears = useMemo(() => {
    const years = events.map(e => getEventYear(e));
    const unique = [...new Set(years)].sort((a, b) => b - a); // descending order of years
    return unique.map(String);
  }, [events]);

  // Get sorted list of years that have matching events in the current results
  const sortedResultYears = useMemo(() => {
    return Object.keys(processedEvents).sort((a, b) => b - a); // descending order
  }, [processedEvents]);

  if (loading) {
    return (
      <div className="loading-state-container">
        <div className="loading-spinner" />
        <p>Loading events page...</p>
      </div>
    );
  }

  return (
    <div className="events-directory-page" id="events-directory">
      <div className="events-hero-header">
        <div className="hero-grid-pattern"></div>
        <div className="hero-gradient-orb"></div>
        <div className="events-hero-content">
          <span className="events-hero-subtitle">Midpoint Exhibitions</span>
          <h1 className="events-hero-title">EXPLORE OUR EVENTS</h1>
          <p className="events-hero-desc">
            Discover and register for world-class educational expos, university fairs, and training conferences across the GCC region.
          </p>
        </div>
      </div>

      <div className="events-filter-sticky">
        <div className="events-filter-inner">
          <div className="events-search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by title, location or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="events-year-chips">
            <button
              className={`year-chip ${selectedYearFilter === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedYearFilter('All')}
            >
              All Years
            </button>
            {uniqueYears.map(yr => (
              <button
                key={yr}
                className={`year-chip ${selectedYearFilter === yr ? 'active' : ''}`}
                onClick={() => setSelectedYearFilter(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="events-results-container">
        {sortedResultYears.length > 0 ? (
          sortedResultYears.map(year => {
            const yearData = processedEvents[year];
            const totalCount = yearData.upcoming.length + yearData.ended.length;

            const renderCard = (event) => {
              const themeColor = event.eventColor || 'var(--color-primary)';
              return (
                <div
                  key={event.id}
                  className={`event-directory-card ${event.finished ? 'is-finished' : 'is-upcoming'}`}
                  style={{ '--event-theme': themeColor }}
                  onClick={() => navigate(`/event/${event.slug}`, { state: { event } })}
                >
                  <div className="card-media-wrapper">
                    {event.mediaUrl || event.image ? (
                      event.mediaType === 'video' ? (
                        <div className="card-video-container">
                          <video src={event.mediaUrl} muted playsInline loop autoPlay />
                          <div className="video-overlay" />
                        </div>
                      ) : (
                        <img src={event.mediaUrl || event.image} alt={event.title} className="card-image" />
                      )
                    ) : (
                      <PlaceholderImage height="200px" label={event.title} />
                    )}
                    
                    <div className="card-badges-container">
                      {event.language && (
                        <span className="card-lang-badge">{event.language}</span>
                      )}
                      
                      {event.finished ? (
                        <span className="card-status-badge finished-badge">
                          <CalendarClock size={12} /> Event Ended
                        </span>
                      ) : (
                        <span className="card-status-badge upcoming-badge">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-body-content">
                    <h3 className="card-event-title">{event.title}</h3>
                    
                    <div className="card-meta-list">
                      <div className="card-meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>{event.date}</span>
                      </div>
                      
                      {event.location && (
                        <div className="card-meta-item">
                          <MapPin size={14} className="meta-icon" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.language && (
                        <div className="card-meta-item hide-on-desktop">
                          <Globe size={14} className="meta-icon" />
                          <span>{event.language}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer-action">
                      <span className="action-link-text">
                        {event.finished ? 'View Event Details' : 'Register & Details'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div key={year} className="events-year-section">
                <h2 className="events-year-heading">
                  <span>{year}</span>
                  <span className="events-count-badge">
                    {totalCount} {totalCount === 1 ? 'Event' : 'Events'}
                  </span>
                </h2>
                
                {yearData.upcoming.length > 0 && (
                  <div className="events-grid-layout">
                    {yearData.upcoming.map(event => renderCard(event))}
                  </div>
                )}
                
                {yearData.upcoming.length > 0 && yearData.ended.length > 0 && (
                  <div className="events-separator">
                    <span className="separator-text">Ended Events</span>
                  </div>
                )}
                
                {yearData.ended.length > 0 && (
                  <div className="events-grid-layout">
                    {yearData.ended.map(event => renderCard(event))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-events-fallback">
            <CalendarClock size={48} className="fallback-icon" />
            <h3>No Events Found</h3>
            <p>We couldn't find any events matching your search criteria.</p>
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedYearFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
