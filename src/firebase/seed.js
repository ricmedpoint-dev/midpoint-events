/**
 * Firestore Seed Script
 * Run from browser console or a one-off page to populate initial data.
 * Usage: import and call seedAll() once.
 */
import { db } from './config';
import { doc, setDoc } from 'firebase/firestore';

const highlights = [
  { id: 'h1', title: 'First Story', image: '/images/placeholder-highlight-1.jpg', order: 1 },
  { id: 'h2', title: 'Second Story', image: '/images/placeholder-highlight-2.jpg', order: 2 },
  { id: 'h3', title: 'Third Story', image: '/images/placeholder-highlight-3.jpg', order: 3 },
  { id: 'h4', title: 'Fourth Story', image: '/images/placeholder-highlight-4.jpg', order: 4 },
  { id: 'h5', title: 'Fifth Story', image: '/images/placeholder-highlight-5.jpg', order: 5 },
];

const events = [
  {
    id: 'gcc-exhibition-2024',
    slug: 'gcc-exhibition-2024',
    title: 'GCC Exhibition 2024',
    language: 'English / Arabic',
    date: '25 - 27 September 2024',
    location: 'Manarat, Al Saadiyat, UAE',
    rating: 4.5,
    reviewCount: '5,342 comments',
    image: '/images/placeholder-event.jpg',
    featured: true,
    order: 1,
  },
  {
    id: 'gcc-exhibition-rak',
    slug: 'gcc-exhibition-rak',
    title: 'GCC Exhibition RAK',
    language: 'English / Arabic',
    date: '28 - 29 October 2025',
    location: 'RAK Exhibition Center, UAE',
    rating: 4.7,
    reviewCount: '2,100 comments',
    image: '/images/placeholder-event.jpg',
    featured: true,
    order: 2,
  },
  {
    id: 'iue-riyadh',
    slug: 'iue-riyadh',
    title: 'International University Expo',
    language: 'English / Arabic',
    date: 'January 2025',
    location: 'Riyadh, Saudi Arabia',
    rating: 4.6,
    reviewCount: '3,800 comments',
    image: '/images/placeholder-event.jpg',
    featured: true,
    order: 3,
  },
];

const exhibitors = [
  { id: 'uaeu', name: 'United Arab Emir...', fullName: 'United Arab Emirates University', logo: '/images/placeholder-logo-uaeu.png', order: 1 },
  { id: 'rabdan', name: 'Rabdan Academy', fullName: 'Rabdan Academy', logo: '/images/placeholder-logo-rabdan.png', order: 2 },
  { id: 'amity', name: 'Amity University', fullName: 'Amity University Dubai', logo: '/images/placeholder-logo-amity.png', order: 3 },
  { id: 'uos', name: 'University of S...', fullName: 'University of Sharjah', logo: '/images/placeholder-logo-uos.png', order: 4 },
];

const aboutContent = {
  title: 'About Midpoint Events',
  body: 'Midpoint Events is your go-to platform for all upcoming events in your area. From concerts to conferences, we bring you the latest happenings so you never miss out. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tincidunt felis nisi, et consequat tortor pulvinar eget. In viverra ipsum sed volutpat semper. Donec bibendum non tellus ac eleifend. Mauris at erat vitae leo pretium.',
};

export async function seedAll() {
  console.log('🌱 Seeding Firestore...');

  for (const h of highlights) {
    await setDoc(doc(db, 'highlights', h.id), h);
  }
  console.log('✅ Highlights seeded');

  for (const e of events) {
    await setDoc(doc(db, 'events', e.id), e);
  }
  console.log('✅ Events seeded');

  for (const ex of exhibitors) {
    await setDoc(doc(db, 'exhibitors', ex.id), ex);
  }
  console.log('✅ Exhibitors seeded');

  await setDoc(doc(db, 'content', 'about'), aboutContent);
  console.log('✅ About content seeded');

  console.log('🎉 All data seeded successfully!');
}
