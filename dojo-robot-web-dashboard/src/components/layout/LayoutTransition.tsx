import React, { useEffect, useState } from 'react';
import { useLayoutStore } from '../../features/stores/layoutStore';

interface LayoutTransitionProps {
  children: React.ReactNode;
}

export const LayoutTransition: React.FC<LayoutTransitionProps> = ({
  children,
}) => {
  const { currentLayoutId } = useLayoutStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevLayoutId, setPrevLayoutId] = useState(currentLayoutId);
  
  useEffect(() => {
    if (currentLayoutId !== prevLayoutId) {
      setIsTransitioning(true);
      
      // Fade out
      const fadeOutTimer = setTimeout(() => {
        setPrevLayoutId(currentLayoutId);
      }, 150);
      
      // Fade in
      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    }
  }, [currentLayoutId, prevLayoutId]);
  
  return (
    <div
      className={`h-full transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
};
