'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ParticipantName } from '@/types';

interface UserSelectProps {
  onSelect: (user: ParticipantName, password: string) => void;
  error?: string | null;
}

const users: { name: ParticipantName; emoji: string; color: string; gradient: string }[] = [
  { 
    name: 'Никита', 
    emoji: '🦊', 
    color: '#FF6B35',
    gradient: 'from-orange-500 to-amber-500'
  },
  { 
    name: 'Ксюша', 
    emoji: '🦋', 
    color: '#7C3AED',
    gradient: 'from-violet-500 to-purple-500'
  },
  { 
    name: 'Саня', 
    emoji: '🐺', 
    color: '#0EA5E9',
    gradient: 'from-cyan-500 to-blue-500'
  },
];

export function UserSelect({ onSelect, error }: UserSelectProps) {
  const [hoveredUser, setHoveredUser] = useState<ParticipantName | null>(null);
  const [selectedUser, setSelectedUser] = useState<ParticipantName | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Сбрасываем loading при получении ошибки
  useEffect(() => {
    if (error) {
      setIsLoading(false);
    }
  }, [error]);

  const handleUserClick = (user: ParticipantName) => {
    setSelectedUser(user);
    setPassword('');
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword('');
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && password && !isLoading) {
      setIsLoading(true);
      onSelect(selectedUser, password);
    }
  };

  const selectedUserData = users.find(u => u.name === selectedUser);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center px-6"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
                <span className="gradient-text">Team CRM</span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg font-light tracking-wide">
                Выбери свой профиль
              </p>
            </motion.div>

            {/* User cards */}
            <div className="flex gap-6 justify-center flex-wrap">
              {users.map((user, index) => (
                <motion.button
                  key={user.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleUserClick(user.name)}
                  onMouseEnter={() => setHoveredUser(user.name)}
                  onMouseLeave={() => setHoveredUser(null)}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div 
                    className={`absolute -inset-1 bg-gradient-to-r ${user.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                  />
                  
                  {/* Card */}
                  <div className={`
                    relative w-36 h-44 sm:w-44 sm:h-56 rounded-2xl overflow-hidden
                    bg-card border border-border
                    backdrop-blur-xl
                    transition-all duration-300
                    group-hover:border-primary/30
                    group-hover:-translate-y-2
                    group-hover:shadow-2xl
                  `}>
                    {/* Top accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${user.gradient}`} />
                    
                    {/* Emoji */}
                    <div className="pt-6 sm:pt-10 pb-3 sm:pb-4">
                      <motion.span 
                        className="text-5xl sm:text-6xl block"
                        animate={{ 
                          scale: hoveredUser === user.name ? 1.1 : 1,
                          rotate: hoveredUser === user.name ? [0, -5, 5, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {user.emoji}
                      </motion.span>
                    </div>
                    
                    {/* Name */}
                    <div className="px-4">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground transition-all duration-300">
                        {user.name}
                      </h3>
                    </div>

                    {/* Bottom decoration */}
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2">
                      <div className={`
                        w-10 h-0.5 rounded-full bg-muted
                        group-hover:bg-gradient-to-r group-hover:${user.gradient}
                        group-hover:w-16 transition-all duration-300
                      `} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="password"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 text-center px-6"
          >
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="absolute top-0 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>←</span>
              <span>Назад</span>
            </motion.button>

            {/* User info */}
            <div className="mb-8">
              <motion.span 
                className="text-6xl sm:text-7xl block mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {selectedUserData?.emoji}
              </motion.span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{selectedUser}</h2>
              <p className="text-muted-foreground">Введите пароль для входа</p>
            </div>

            {/* Password form */}
            <form onSubmit={handleSubmit} className="max-w-xs mx-auto">
              <div className="relative mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль"
                  autoFocus
                  className={`
                    w-full h-12 px-4 rounded-xl
                    bg-muted border 
                    ${error ? 'border-destructive' : 'border-border'}
                    text-foreground text-center text-lg tracking-widest
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    transition-all
                  `}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm mb-4"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={!password || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full py-3 rounded-xl font-medium
                  bg-gradient-to-r ${selectedUserData?.gradient}
                  text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                `}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
