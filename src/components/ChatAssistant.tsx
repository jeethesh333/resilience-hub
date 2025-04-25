import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Fab,
  Zoom,
  Slide,
  Divider,
  CircularProgress,
  Button,
  Tooltip,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import { User } from '../types';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatAssistantProps {
  userData: User;
}

// Initialize Gemini API in a secure way
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// Validate API key
if (!API_KEY) {
  console.error('Gemini API key is not configured. Please check your environment variables.');
}

// Function to convert markdown to plain text
const convertMarkdownToPlainText = (markdown: string): string => {
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/#{1,6}\s/g, '')       // Headers
    .replace(/`(.*?)`/g, '$1')      // Code
    .replace(/\n\s*[-*+]\s/g, '\n') // Lists
    .replace(/\n\s*\d+\.\s/g, '\n') // Numbered lists
    .trim();
};

const ChatAssistant: React.FC<ChatAssistantProps> = ({ userData }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterQuestions = [
    "How can I stay motivated during my challenge?",
    "What are some tips for building resilience?",
    "How do I handle setbacks in my journey?"
  ];

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add welcome message when opened for the first time
      try {
        setMessages([
          {
            id: Date.now().toString(),
            content: `Hi ${userData?.name || 'there'}! I'm your resilience assistant. How can I help you with your challenges today?`,
            sender: 'assistant',
            timestamp: new Date()
          }
        ]);
      } catch (error) {
        console.error("Error setting welcome message:", error);
        setHasError(true);
      }
    }
  }, [open, userData?.name, messages.length]);

  useEffect(() => {
    try {
      // Scroll to bottom of messages
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Error scrolling to bottom:", error);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Create context from user data
      const userDataContext = {
        name: userData?.name || 'User',
        challenges: (userData?.challenges || []).map(c => ({
          name: c.name,
          duration: c.duration,
          completedDays: c.completedDays,
          progress: Math.floor((c.completedDays / c.duration) * 100)
        })),
        hasReflectionToday: Boolean(userData?.dailyNotes && userData.dailyNotes[new Date().toISOString().split('T')[0]])
      };

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are a resilience coach assistant. The user's name is ${userData?.name || 'there'}. 
                  Here's the current user data: ${JSON.stringify(userDataContext)}. 
                  The user said: ${newMessage}. 
                  Provide a helpful, encouraging, and concise response focused on building resilience, 
                  personal growth, and habit formation. Keep your response under 200 words.
                  Format your response in clear paragraphs with proper spacing.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topK: 40,
            topP: 0.95,
            stopSequences: []
          }
        })
      });

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const plainTextResponse = convertMarkdownToPlainText(data.candidates[0].content.parts[0].text);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: plainTextResponse,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error with Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterQuestionClick = (question: string) => {
    setNewMessage(question);
    handleSendMessage();
  };

  const handleNewChat = () => {
    setMessages([]);
    setNewMessage('');
    // Trigger welcome message again
    setMessages([
      {
        id: Date.now().toString(),
        content: `Hi ${userData?.name || 'there'}! I'm your resilience assistant. How can I help you with your challenges today?`,
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopyNotification(true);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // If there's an error in the component, render a simplified version
  if (hasError) {
    return (
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => window.location.reload()}
          sx={{
            background: 'linear-gradient(45deg, #3a86ff 30%, #8338ec 90%)',
            boxShadow: '0 6px 15px rgba(58, 134, 255, 0.3)',
          }}
        >
          <ChatIcon />
        </Fab>
      </Box>
    );
  }

  return (
    <>
      {/* Chat Button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Zoom in={!open}>
          <Fab
            color="primary"
            aria-label="chat"
            onClick={() => setOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #3a86ff 30%, #8338ec 90%)',
              boxShadow: '0 6px 15px rgba(58, 134, 255, 0.3)',
            }}
          >
            <ChatIcon />
          </Fab>
        </Zoom>
      </Box>

      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 350 },
            height: 450,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            bgcolor: 'background.paper'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(45deg, #3a86ff 30%, #8338ec 90%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon />
              <Typography variant="subtitle1" fontWeight={600}>
                Resilience Assistant
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Search Messages">
                <IconButton 
                  color="inherit" 
                  onClick={() => setIsSearching(!isSearching)}
                  size="small"
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="New Chat">
                <IconButton 
                  color="inherit" 
                  onClick={handleNewChat}
                  size="small"
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'rotate(90deg)',
                      transition: 'transform 0.3s ease'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton 
                  color="inherit" 
                  onClick={() => setOpen(false)} 
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Search Bar */}
          {isSearching && (
            <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#f5f7fa',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {filteredMessages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                {message.sender === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'white',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    position: 'relative',
                    maxWidth: message.sender === 'user' ? '85%' : '85%',
                    width: 'fit-content',
                    marginLeft: message.sender === 'assistant' ? 0 : 'auto',
                    marginRight: message.sender === 'user' ? 0 : 'auto',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      '& ul, & ol': {
                        pl: 2,
                        mb: 1,
                      },
                      '& li': {
                        mb: 0.5,
                      }
                    }}
                  >
                    {message.content}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 1,
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: message.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyMessage(message.content)}
                      sx={{ 
                        color: message.sender === 'user' ? 'white' : 'primary.main',
                        opacity: 0.5,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
                {message.sender === 'user' && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'secondary.light',
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
              </Box>
            ))}
            
            {/* Starter Questions */}
            {messages.length === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, width: '100%' }}>
                {starterQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleStarterQuestionClick(question)}
                    sx={{
                      alignSelf: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      borderColor: 'primary.light',
                      color: 'primary.main',
                      maxWidth: '85%',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'primary.dark'
                      }
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </Box>
            )}

            {isLoading && (
              <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start', width: '100%' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    maxWidth: '85%',
                  }}
                >
                  <CircularProgress size={20} thickness={4} />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              InputProps={{
                sx: { borderRadius: 3 },
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ mr: 1 }}
                    >
                      {newMessage.length}/200
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} thickness={4} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      </Slide>

      {/* Copy Notification */}
      <Snackbar
        open={showCopyNotification}
        autoHideDuration={2000}
        onClose={() => setShowCopyNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Message copied to clipboard
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChatAssistant; 