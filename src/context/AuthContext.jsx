import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserProfile } from '../firebase/firestore';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from Firebase and LocalStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUser(savedUser);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync with Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || (profile?.name) || 'User',
            photoURL: firebaseUser.photoURL || (profile?.photoURL) || null,
            ...profile
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error("AuthContext: Profile sync failed", error);
        }
      } else {
        // Only clear if not in admin-shortcut mode
        const current = JSON.parse(localStorage.getItem('user'));
        if (current?.uid !== 'admin-uid') {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("AuthContext: SignOut error", e);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin: user?.email === 'admin@midpoint.ae' || user?.uid === 'admin-uid'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
