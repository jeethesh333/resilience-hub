import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface TypingAnimationProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  delay = 0,
  speed = 50,
  className
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    // Clear any existing intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      
      intervalRef.current = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsComplete(true);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, delay, speed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'inline-block', width: '100%' }}
    >
      <Box component="span" className={className} sx={{ width: '100%', display: 'inline-block' }}>
        {displayedText}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ display: 'inline-block' }}
          >
            |
          </motion.span>
        )}
      </Box>
    </motion.div>
  );
};

export default TypingAnimation; 