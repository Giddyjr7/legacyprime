import React, { useState, useEffect, useRef } from 'react';
import { MdMail } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

interface Position {
  x: number;
  y: number;
}

export const SupportFloatingButton: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();


  // Constants for layout and persistence
  const STORAGE_KEY = 'supportButtonPosition';
  const BUTTON_SIZE = 48; // 3rem = 48px (reduced)
  const PADDING = 16; // 1rem = 16px

  const [position, setPosition] = useState<Position>(() => ({
    x: window.innerWidth - BUTTON_SIZE - PADDING,
    y: window.innerHeight - BUTTON_SIZE - PADDING,
  }));

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem(STORAGE_KEY);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        console.error('Failed to load saved position:', error);
      }
    }
  }, []);

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  // Handle touch down - start dragging on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const offsetX = e.touches[0].clientX - rect.left;
    const offsetY = e.touches[0].clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  // Handle mouse move - drag the button
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain position within viewport
      newX = Math.max(PADDING, Math.min(newX, window.innerWidth - BUTTON_SIZE - PADDING));
      newY = Math.max(PADDING, Math.min(newY, window.innerHeight - BUTTON_SIZE - PADDING));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  // Handle touch move - drag the button on mobile
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      let newX = e.touches[0].clientX - dragOffset.x;
      let newY = e.touches[0].clientY - dragOffset.y;

      // Constrain position within viewport
      newX = Math.max(PADDING, Math.min(newX, window.innerWidth - BUTTON_SIZE - PADDING));
      newY = Math.max(PADDING, Math.min(newY, window.innerHeight - BUTTON_SIZE - PADDING));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      // Save position to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, position]);

  // Handle window resize - adjust position if out of bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (prev.x + BUTTON_SIZE + PADDING > window.innerWidth) {
          newX = window.innerWidth - BUTTON_SIZE - PADDING;
        }

        if (prev.y + BUTTON_SIZE + PADDING > window.innerHeight) {
          newY = window.innerHeight - BUTTON_SIZE - PADDING;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEmailClick = () => {
    const email = 'support@legacy-prime.com';
    const subject = 'Customer Support Request';
    const body = 'Hello, I need help with…';

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Gmail web compose link (opens Gmail compose in a new tab)
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try to open Gmail in a new tab; fallback to mailto if blocked or unavailable
    const newWin = window.open(gmailLink, '_blank');
    if (!newWin) {
      // Popup blocked or window couldn't be opened — fallback to mailto
      window.location.href = mailtoLink;
    }
  };

  // Only show the button when the user is authenticated
  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div
      ref={buttonRef}
      className={`fixed w-12 h-12 rounded-full shadow-lg transition-all duration-200 ease-out ${
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #9b87f5 0%, #6E59A5 100%)',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <button
        onClick={handleEmailClick}
        className="w-full h-full rounded-full flex items-center justify-center text-white hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9b87f5] group relative"
        title="Contact Support"
      >
        <MdMail
          size={20}
          className="transition-transform duration-200 group-hover:scale-110"
        />

        {/* Subtle pulse animation indicator */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping" />
      </button>
    </div>
  );
};

export default SupportFloatingButton;
