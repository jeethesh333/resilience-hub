import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Alert,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  LinearProgress,
  Fade,
  Zoom,
  Tabs,
  Tab,
  CircularProgress,
  Fab,
  Grow,
  ButtonBase
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import StarIcon from '@mui/icons-material/Star';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import NightlightIcon from '@mui/icons-material/Nightlight';
import BrushIcon from '@mui/icons-material/Brush';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CodeIcon from '@mui/icons-material/Code';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import MobileOffIcon from '@mui/icons-material/MobileOff';
import PrayIcon from '@mui/icons-material/Accessibility';
import CleanHandsIcon from '@mui/icons-material/CleanHands';
import ToothbrushIcon from '@mui/icons-material/Sanitizer';
import ShowerIcon from '@mui/icons-material/Shower';
import VapeFreeBrushIcon from '@mui/icons-material/SmokeFree';
import SelfDisciplineIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BlockIcon from '@mui/icons-material/Block';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { Challenge, User } from '../types';
import TypingAnimation from '../components/TypingAnimation';
import ChatAssistant from '../components/ChatAssistant';
import ProgressAnalytics from '../components/ProgressAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { getUserData, updateUserData, updateChallenges, updateDailyNotes, resetUserData, createUserDocument } from '../services/firestore';
import { styled } from '@mui/material/styles';

interface MilestoneAchievement {
  percentage: number;
  icon: JSX.Element;
  title: string;
  description: string;
  color: string;
}

const milestones: MilestoneAchievement[] = [
  {
    percentage: 0,
    icon: <FitnessCenterIcon />,
    title: "First Step",
    description: "You've started your journey! The hardest part is beginning.",
    color: "#00b4d8"
  },
  {
    percentage: 7,
    icon: <LocalFireDepartmentIcon />,
    title: "Week Champion",
    description: "A full week of dedication! You're building strong habits.",
    color: "#f9844a"
  },
  {
    percentage: 25,
    icon: <StarIcon />,
    title: "Getting Started",
    description: "You're building momentum!",
    color: "#2ec4b6"
  },
  {
    percentage: 50,
    icon: <MilitaryTechIcon />,
    title: "Halfway There",
    description: "Keep pushing forward!",
    color: "#ff9f1c"
  },
  {
    percentage: 75,
    icon: <WorkspacePremiumIcon />,
    title: "Almost There",
    description: "The finish line is in sight!",
    color: "#e76f51"
  },
  {
    percentage: 100,
    icon: <EmojiEventsIcon />,
    title: "Challenge Complete",
    description: "You've done it! Incredible work!",
    color: "#2a9d8f"
  }
];

// ErrorBoundary component to catch errors in child components
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Render nothing if there's an error
    }
    return this.props.children;
  }
}

// Scroll restoration component to ensure page starts at top
const ScrollToTop: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return null;
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<User>({ name: '', challenges: [], dailyNotes: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    return sessionStorage.getItem('hasShownWelcome') === 'true';
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [dailyNoteDialog, setDailyNoteDialog] = useState(false);
  const [editLogDialog, setEditLogDialog] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ name: '', duration: '' });
  const [note, setNote] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editChallengeId, setEditChallengeId] = useState<string | null>(null);
  const [editLogDay, setEditLogDay] = useState<number | null>(null);
  const [dailyNote, setDailyNote] = useState('');
  const [challengeIdForNote, setChallengeIdForNote] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [showMilestone, setShowMilestone] = useState<{
    challengeId: string;
    milestone: MilestoneAchievement;
  } | null>(null);
  const [updateDurationDialog, setUpdateDurationDialog] = useState(false);
  const [newDuration, setNewDuration] = useState<string>('');
  const [currentTab, setCurrentTab] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !localStorage.getItem('hasVisitedDashboard');
  });
  const [lastKnownDate, setLastKnownDate] = useState(() => {
    return localStorage.getItem('lastKnownDate') || new Date().toISOString().split('T')[0];
  });
  const today = new Date().toISOString().split('T')[0];
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Function to convert string to title case
  const toTitleCase = (str: string) => {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Load user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getUserData(currentUser.uid);
        if (data) {
          setUserData(data);
        } else {
          // Initialize user data if it doesn't exist
          const initialData = {
            name: currentUser.displayName || '',
            challenges: [],
            dailyNotes: {}
          };
          await createUserDocument(currentUser.uid, initialData);
          setUserData(initialData);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!hasShownWelcome) {
      sessionStorage.setItem('hasShownWelcome', 'true');
      setHasShownWelcome(true);
    }
  }, [hasShownWelcome]);

  // Add effect to check for date change
  useEffect(() => {
    const checkDateChange = () => {
      const today = new Date().toISOString().split('T')[0];
      
      if (today !== lastKnownDate) {
        // Date has changed, update the last known date
        localStorage.setItem('lastKnownDate', today);
        setLastKnownDate(today);
        
        // Update user data to reflect new day
        const updatedUserData = {
          ...userData,
          challenges: userData.challenges.map(challenge => {
            // Reset the hasMarkedTodayComplete state for each challenge
            return {
              ...challenge,
              // Keep all other properties the same
            };
          })
        };
        
        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
    };

    // Check for date change every minute
    const interval = setInterval(checkDateChange, 60000);
    
    // Initial check
    checkDateChange();
    
    return () => clearInterval(interval);
  }, [lastKnownDate, userData]);

  const handleAddChallenge = async () => {
    if (!currentUser) return;

    const challenge: Challenge = {
      id: Date.now().toString(),
      name: newChallenge.name,
      duration: parseInt(newChallenge.duration),
      startDate: new Date().toISOString(),
      completedDays: 0,
      notes: {}
    };

    const updatedChallenges = [...userData.challenges, challenge];
    
    try {
      await updateChallenges(currentUser.uid, updatedChallenges);
      setUserData(prev => ({
        ...prev,
        challenges: updatedChallenges
      }));
    } catch (error) {
      console.error('Error adding challenge:', error);
    }

    setOpenDialog(false);
    setNewChallenge({ name: '', duration: '' });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, challengeId: string) => {
    setChallengeIdForNote(challengeId);
    setNote(e.target.value);
  };

  // Check if a challenge has been marked complete today
  const hasMarkedTodayComplete = (challenge: Challenge): boolean => {
    const startDate = new Date(challenge.startDate);
    const today = new Date();
    
    // Calculate days since start (floor to handle time differences)
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get the last completed day from the notes
    const lastCompletedDay = Math.max(...Object.keys(challenge.notes).map(Number), 0);
    
    // Check if the last completed day matches today's day number
    return lastCompletedDay === daysSinceStart + 1;
  };

  // Function to check and show milestone achievements
  const checkMilestoneAchievement = (challenge: Challenge) => {
    const currentPercentage = Math.floor((challenge.completedDays / challenge.duration) * 100);
    
    // Check for day-specific milestones first
    if (challenge.completedDays === 1) {
      setShowMilestone({
        challengeId: challenge.id,
        milestone: {
          ...milestones[0],
          percentage: currentPercentage // Update with current progress
        }
      });
      return;
    }

    if (challenge.completedDays === 7) {
      setShowMilestone({
        challengeId: challenge.id,
        milestone: {
          ...milestones[1],
          percentage: currentPercentage // Update with current progress
        }
      });
      return;
    }

    // Then check percentage-based milestones
    const achievedMilestone = milestones
      .slice(2) // Skip the day-based milestones
      .reverse()
      .find(m => currentPercentage >= m.percentage);

    if (achievedMilestone) {
      setShowMilestone({
        challengeId: challenge.id,
        milestone: {
          ...achievedMilestone,
          percentage: currentPercentage // Update with current progress
        }
      });
    }
  };

  const handleMarkComplete = async (challengeId: string) => {
    if (!currentUser) return;

    const challenge = userData.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    if (hasMarkedTodayComplete(challenge)) {
      alert("You've already marked today's challenge as complete. Come back tomorrow!");
      return;
    }

    const updatedChallenges = userData.challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const currentDay = challenge.completedDays + 1;
        const updatedChallenge = {
          ...challenge,
          completedDays: currentDay,
          notes: {
            ...challenge.notes,
            [currentDay]: note
          }
        };
        
        checkMilestoneAchievement(updatedChallenge);
        return updatedChallenge;
      }
      return challenge;
    });

    try {
      await updateChallenges(currentUser.uid, updatedChallenges);
      setUserData(prev => ({
        ...prev,
        challenges: updatedChallenges
      }));
    } catch (error) {
      console.error('Error updating challenge completion:', error);
    }

    setNote('');
    setChallengeIdForNote(null);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    setChallengeToDelete(challengeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!currentUser || !challengeToDelete) return;
    
    const updatedChallenges = userData.challenges.filter(
      challenge => challenge.id !== challengeToDelete
    );

    try {
      await updateChallenges(currentUser.uid, updatedChallenges);
      setUserData(prev => ({
        ...prev,
        challenges: updatedChallenges
      }));
    } catch (error) {
      console.error('Error deleting challenge:', error);
    }

    setDeleteDialogOpen(false);
    setChallengeToDelete(null);
  };

  const handleOpenLogMenu = (event: React.MouseEvent<HTMLButtonElement>, challengeId: string) => {
    event.stopPropagation(); // Prevent event bubbling
    setMenuAnchorEl(event.currentTarget);
    setSelectedChallengeId(challengeId);
  };

  const handleCloseLogMenu = () => {
    setMenuAnchorEl(null);
    setSelectedChallengeId(null);
  };

  const handleEditLog = () => {
    if (!selectedChallengeId) return;
    
    const challenge = userData.challenges.find(c => c.id === selectedChallengeId);
    if (!challenge) return;
    
    // For new challenges or no notes, start with empty note
    setEditChallengeId(selectedChallengeId);
    setEditLogDay(challenge.completedDays || 1);
    setEditNote(challenge.notes[challenge.completedDays] || '');
    setEditLogDialog(true);
    handleCloseLogMenu();
  };

  const handleDeleteLog = () => {
    if (!selectedChallengeId) return;
    
    const updatedChallenges = userData.challenges.map(challenge => {
      if (challenge.id === selectedChallengeId) {
        const currentDay = challenge.completedDays || 1;
        // Create a copy of notes without the current day
        const { [currentDay]: deletedNote, ...remainingNotes } = challenge.notes;
        
        const updatedChallenge = {
          ...challenge,
          completedDays: Math.max(0, currentDay - 1),
          notes: remainingNotes
        };

        // Check for milestone immediately without delay
        checkMilestoneAchievement(updatedChallenge);
        
        return updatedChallenge;
      }
      return challenge;
    });

    const updatedUserData = {
      ...userData,
      challenges: updatedChallenges
    };

    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    handleCloseLogMenu();
  };

  const handleSaveEditedLog = async () => {
    if (!currentUser || !editChallengeId || editLogDay === null) return;
    
    const updatedChallenges = userData.challenges.map(challenge => {
      if (challenge.id === editChallengeId) {
        return {
          ...challenge,
          notes: {
            ...challenge.notes,
            [editLogDay]: editNote
          }
        };
      }
      return challenge;
    });

    try {
      await updateChallenges(currentUser.uid, updatedChallenges);
      setUserData(prev => ({
        ...prev,
        challenges: updatedChallenges
      }));
    } catch (error) {
      console.error('Error updating challenge note:', error);
    }

    setEditLogDialog(false);
  };

  const handleResetAll = async () => {
    if (!currentUser) return;

    try {
      await resetUserData(currentUser.uid, userData.name);
      setUserData({
        name: userData.name,
        challenges: [],
        dailyNotes: {}
      });
      setIsFirstVisit(true);
      setResetDialogOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error resetting user data:', error);
    }
  };

  const handleDailyNoteSubmit = async () => {
    if (!currentUser) return;

    const updatedDailyNotes = {
      ...userData.dailyNotes,
      [today]: dailyNote
    };

    try {
      await updateDailyNotes(currentUser.uid, updatedDailyNotes);
      setUserData(prev => ({
        ...prev,
        dailyNotes: updatedDailyNotes
      }));
    } catch (error) {
      console.error('Error updating daily note:', error);
    }

    setDailyNoteDialog(false);
  };

  const handleUpdateDuration = async () => {
    if (!currentUser || !selectedChallengeId || !newDuration) return;
    
    const updatedDuration = parseInt(newDuration);
    
    if (updatedDuration < 10) {
      alert("Challenge duration must be at least 10 days");
      return;
    }

    const selectedChallenge = userData.challenges.find(c => c.id === selectedChallengeId);
    
    if (!selectedChallenge) return;
    
    if (updatedDuration < selectedChallenge.completedDays) {
      alert("New duration cannot be less than completed days");
      return;
    }
    
    const updatedChallenges = userData.challenges.map(challenge => {
      if (challenge.id === selectedChallengeId) {
        return {
          ...challenge,
          duration: updatedDuration
        };
      }
      return challenge;
    });

    try {
      await updateChallenges(currentUser.uid, updatedChallenges);
      setUserData(prev => ({
        ...prev,
        challenges: updatedChallenges
      }));
    } catch (error) {
      console.error('Error updating challenge duration:', error);
    }

    setUpdateDurationDialog(false);
    setNewDuration('');
  };

  // Calculate challenge streaks and percentages
  const getProgressPercentage = (challenge: Challenge): number => {
    return Math.floor((challenge.completedDays / challenge.duration) * 100);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Function to get appropriate icon based on challenge name
  const getChallengeIcon = (challengeName: string) => {
    const name = challengeName.toLowerCase();
    
    // Spiritual/Mindfulness
    if (name.includes('pray') || name.includes('spiritual') || name.includes('worship') || name.includes('reflection')) {
      return <PrayIcon fontSize="small" />;
    }
    
    // Personal habits / addictions
    if (name.includes('nofap') || name.includes('semen retention') || name.includes('masturbation') || name.includes('porn') || name.includes('addiction')) {
      return <VisibilityOffIcon fontSize="small" />;
    }
    if (name.includes('abstain') || name.includes('abstinence') || name.includes('dopamine') || name.includes('quit addiction')) {
      return <VapeFreeBrushIcon fontSize="small" />;
    }
    if (name.includes('self control') || name.includes('discipline') || name.includes('purity') || name.includes('temptation')) {
      return <SelfDisciplineIcon fontSize="small" />;
    }
    
    // Digital/Technology related
    if (name.includes('phone') || name.includes('mobile') || name.includes('screen') || name.includes('device')) {
      return <SmartphoneIcon fontSize="small" />;
    }
    if (name.includes('digital detox') || name.includes('no phone') || name.includes('screen time') || name.includes('less tech')) {
      return <MobileOffIcon fontSize="small" />;
    }
    
    // Hygiene related
    if (name.includes('shower') || name.includes('bath')) {
      return <ShowerIcon fontSize="small" />;
    }
    if (name.includes('brush') || name.includes('teeth') || name.includes('dental') || name.includes('floss')) {
      return <ToothbrushIcon fontSize="small" />;
    }
    if (name.includes('wash') || name.includes('clean') || name.includes('hygiene')) {
      return <CleanHandsIcon fontSize="small" />;
    }
    
    // Exercise/Fitness related
    if (name.includes('run') || name.includes('jog') || name.includes('marathon') || name.includes('walk')) {
      return <DirectionsRunIcon fontSize="small" />;
    }
    if (name.includes('workout') || name.includes('gym') || name.includes('exercise') || name.includes('training') || name.includes('strength')) {
      return <FitnessCenterIcon fontSize="small" />;
    }
    
    // Mindfulness/Mental health
    if (name.includes('meditat') || name.includes('yoga') || name.includes('breath')) {
      return <SelfImprovementIcon fontSize="small" />;
    }
    if (name.includes('mental') || name.includes('mind') || name.includes('brain') || name.includes('think')) {
      return <PsychologyIcon fontSize="small" />;
    }
    if (name.includes('calm') || name.includes('stress') || name.includes('relax')) {
      return <SpaIcon fontSize="small" />;
    }
    
    // Learning/Growth
    if (name.includes('read') || name.includes('book')) {
      return <MenuBookIcon fontSize="small" />;
    }
    if (name.includes('learn') || name.includes('study') || name.includes('education') || name.includes('course')) {
      return <SchoolIcon fontSize="small" />;
    }
    
    // Coding/Programming specific languages
    if (name.includes('code') || name.includes('program') || name.includes('develop') || 
        name.includes('python') || name.includes('javascript') || name.includes('java') || 
        name.includes('c++') || name.includes('typescript') || name.includes('coding') || 
        name.includes('html') || name.includes('css') || name.includes('react') || 
        name.includes('node') || name.includes('programming')) {
      return <CodeIcon fontSize="small" />;
    }
    
    // Health/Habits
    if (name.includes('water') || name.includes('hydrate')) {
      return <WaterDropIcon fontSize="small" />;
    }
    if (name.includes('sleep') || name.includes('bed') || name.includes('rest')) {
      return <NightlightIcon fontSize="small" />;
    }
    if (name.includes('eat') || name.includes('diet') || name.includes('nutrition') || name.includes('food')) {
      return <RestaurantIcon fontSize="small" />;
    }
    if (name.includes('health') || name.includes('habit')) {
      return <FavoriteIcon fontSize="small" />;
    }
    if (name.includes('avoid') || name.includes('quit') || name.includes('no ') || name.includes('stop')) {
      return <BlockIcon fontSize="small" />;
    }
    
    // Creative
    if (name.includes('art') || name.includes('draw') || name.includes('paint')) {
      return <PaletteIcon fontSize="small" />;
    }
    if (name.includes('writ') || name.includes('journal')) {
      return <BrushIcon fontSize="small" />;
    }
    if (name.includes('music') || name.includes('sing') || name.includes('play') || name.includes('song')) {
      return <MusicNoteIcon fontSize="small" />;
    }
    
    // Personal growth/Resilience
    if (name.includes('volunteer') || name.includes('help') || name.includes('kind') || name.includes('giv')) {
      return <VolunteerActivismIcon fontSize="small" />;
    }
    if (name.includes('gratitude') || name.includes('thank') || name.includes('appreciate')) {
      return <FavoriteIcon fontSize="small" />;
    }
    if (name.includes('challenge') || name.includes('goal') || name.includes('achieve')) {
      return <StarIcon fontSize="small" />;
    }
    if (name.includes('fire') || name.includes('streak') || name.includes('consisten')) {
      return <LocalFireDepartmentIcon fontSize="small" />;
    }
    
    // Default icon if no match
    return <FitnessCenterIcon fontSize="small" />;
  };

  const handleSignOut = () => {
    setSignOutDialogOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Define menu actions
  const menuActions = [
    { icon: <AddIcon />, name: 'Add Challenge', onClick: () => setOpenDialog(true) },
    { icon: <HistoryIcon />, name: 'Notes History', onClick: () => navigate('/notes-history') },
    { icon: <AccountCircleIcon />, name: 'Profile', onClick: () => navigate('/profile') },
    { icon: <RefreshIcon />, name: 'Reset All', onClick: () => setResetDialogOpen(true), color: 'error' },
    { icon: <LogoutIcon />, name: 'Sign Out', onClick: handleSignOut }
  ];

  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 2
      }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  if (!userData.name) {
    return null;
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        pb: 10, // Add padding at bottom to make room for menu
        position: 'relative'
      }}
    >
      <ScrollToTop />
      
      {/* Fixed Header Section */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: { xs: 2, sm: 3 } }}>
            <Fade in={true} timeout={800}>
              <Box>
                {/* Header - Simplified without action buttons */}
                <Grid container spacing={2} alignItems="center">
                  {/* Avatar and Welcome message */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#2ec4b6', 
                          width: 40, 
                          height: 40,
                          boxShadow: '0 4px 10px rgba(46, 196, 182, 0.3)'
                        }}
                      >
                        <LocalFireDepartmentIcon />
                      </Avatar>
                      {!isFirstVisit ? (
                        <Typography variant="h5" component="h1" 
                          sx={{ 
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #2ec4b6, #ff9f1c)',
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                          }}
                        >
                          Welcome, {toTitleCase(userData.name)}!
                        </Typography>
                      ) : (
                        <Box 
                          component="h1"
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                            m: 0,
                            background: 'linear-gradient(90deg, #2ec4b6, #ff9f1c)',
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          <TypingAnimation
                            text={`Welcome, ${toTitleCase(userData.name)}!`}
                            delay={500}
                            speed={50}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 120,
                  fontWeight: 600
                }
              }}
            >
              <Tab 
                label="Challenges" 
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              />
              <Tab 
                label="Analytics" 
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              />
            </Tabs>
          </Box>
        </Container>
      </Box>

      {/* Scrollable Content Section */}
      <Box 
        sx={{ 
          flexGrow: 1,
          mt: { xs: '140px', sm: '150px' }, // Reduced from 180px/200px
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Tab Panels */}
        {currentTab === 0 ? (
          // Challenges View
          <Grid container spacing={3}>
            {/* Daily Note Card - Moved to top */}
            <Grid item xs={12}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  mb: 3, // Reduced from mb: 4
                  borderRadius: 3, 
                  background: 'linear-gradient(135deg, rgba(46, 196, 182, 0.03) 0%, rgba(249, 132, 74, 0.03) 100%)',
                  border: '1px solid rgba(46, 196, 182, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', opacity: 0.03 }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <path d="M0,0 L100,0 L100,100 Z" fill="#2ec4b6" />
                  </svg>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <EditNoteIcon sx={{ color: '#2ec4b6' }} />
                    Today's Reflection
                  </Typography>
                  <Box>
                    <Tooltip title="Edit Reflection">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => setDailyNoteDialog(true)}
                        sx={{ mr: 1 }}
                      >
                        <EditNoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Reflection">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => {
                          const updatedUserData = {
                            ...userData,
                            dailyNotes: {
                              ...userData.dailyNotes,
                              [today]: ''
                            }
                          };
                          setUserData(updatedUserData);
                          localStorage.setItem('userData', JSON.stringify(updatedUserData));
                          setDailyNote('');
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                {userData.dailyNotes && userData.dailyNotes[today] ? (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.7,
                      color: 'text.secondary',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {userData.dailyNotes[today]}
                  </Typography>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<EditNoteIcon />}
                    onClick={() => setDailyNoteDialog(true)}
                    sx={{ 
                      width: '100%',
                      py: 2,
                      borderStyle: 'dashed',
                      color: 'text.secondary'
                    }}
                  >
                    Add your reflection for today
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* Challenge Cards */}
            {userData.challenges.map((challenge, index) => (
              <Zoom 
                in={true} 
                style={{ transitionDelay: `${index * 100}ms` }}
                key={challenge.id}
              >
                <Grid item xs={12} sm={6} md={4} className="animate-in">
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: 'secondary.main',
                              fontSize: '0.8rem'
                            }}
                          >
                            {getChallengeIcon(challenge.name)}
                          </Avatar>
                          <Typography 
                            variant="h6" 
                            sx={{ fontWeight: 600, fontSize: '1.1rem' }}
                          >
                            {challenge.name}
                          </Typography>
                        </Box>
                        <Box>
                          {hasMarkedTodayComplete(challenge) ? (
                            <Tooltip title="Challenge Options">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => handleOpenLogMenu(e, challenge.id)}
                                sx={{ mr: 1 }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          <Tooltip title="Delete Challenge">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteChallenge(challenge.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography color="text.secondary" variant="body2">
                            Progress:
                          </Typography>
                          <Typography 
                            fontWeight={600} 
                            variant="body2"
                            color={getProgressPercentage(challenge) >= 100 ? 'success.main' : 'primary.main'}
                          >
                            {getProgressPercentage(challenge)}%
                          </Typography>
                          {getProgressPercentage(challenge) >= 100 && (
                            <Chip 
                              icon={<EmojiEventsIcon />} 
                              label="Completed!" 
                              size="small" 
                              color="success" 
                              sx={{ height: 24 }}
                            />
                          )}
                        </Stack>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(getProgressPercentage(challenge), 100)} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            mb: 2,
                            bgcolor: 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              background: getProgressPercentage(challenge) >= 100 
                                ? 'linear-gradient(90deg, #2a9d8f, #2ec4b6)' 
                                : 'linear-gradient(90deg, #f9844a, #ff9f1c)'
                            }
                          }}
                        />
                        
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Tooltip
                            title={
                              challenge.notes[challenge.completedDays] ? (
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                                    {new Date(
                                      new Date(challenge.startDate).getTime() + 
                                      (challenge.completedDays - 1) * 24 * 60 * 60 * 1000
                                    ).toLocaleDateString(undefined, {
                                      weekday: 'long',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {challenge.notes[challenge.completedDays]}
                                  </Typography>
                                </Box>
                              ) : ''
                            }
                            arrow
                            placement="top"
                            enterDelay={500}
                            leaveDelay={200}
                            sx={{ 
                              '& .MuiTooltip-tooltip': { 
                                maxWidth: 300,
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                borderRadius: 2,
                                p: 1.5
                              },
                              '& .MuiTooltip-arrow': {
                                color: 'background.paper',
                                '&::before': {
                                  border: '1px solid rgba(0,0,0,0.1)'
                                }
                              }
                            }}
                          >
                            <Chip 
                              label={hasMarkedTodayComplete(challenge) 
                                ? `Day ${challenge.completedDays} of ${challenge.duration} ✅` 
                                : `Day ${challenge.completedDays + 1} of ${challenge.duration}`} 
                              size="small" 
                              color={hasMarkedTodayComplete(challenge) ? "success" : "primary"}
                              variant={hasMarkedTodayComplete(challenge) ? "filled" : "outlined"}
                              sx={{ 
                                borderRadius: 1, 
                                height: 28,
                                fontWeight: hasMarkedTodayComplete(challenge) ? 600 : 400,
                                cursor: challenge.notes[challenge.completedDays] ? 'pointer' : 'default'
                              }}
                            />
                          </Tooltip>
                          
                          <Tooltip title="Update Duration">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedChallengeId(challenge.id);
                                setNewDuration(challenge.duration.toString());
                                setUpdateDurationDialog(true);
                              }}
                            >
                              <DateRangeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                      
                      {hasMarkedTodayComplete(challenge) && (
                        <Alert 
                          icon={<CheckCircleIcon fontSize="inherit" />}
                          severity="success" 
                          sx={{ 
                            mt: 2, 
                            fontSize: '0.8rem',
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              opacity: 1,
                              color: 'success.main'
                            }
                          }}
                        >
                          Today's challenge completed!
                        </Alert>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <TextField
                        size="small"
                        placeholder="Add a note..."
                        value={challengeIdForNote === challenge.id ? note : ''}
                        onChange={(e) => handleNoteChange(e, challenge.id)}
                        fullWidth
                        disabled={hasMarkedTodayComplete(challenge)}
                        sx={{ mr: 1 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleMarkComplete(challenge.id)}
                        disabled={challenge.completedDays >= challenge.duration || hasMarkedTodayComplete(challenge)}
                        sx={{ 
                          whiteSpace: 'nowrap',
                          minWidth: 'auto',
                          px: 1.5
                        }}
                      >
                        <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" /> 
                        Done
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Zoom>
            ))}
          </Grid>
        ) : (
          // Analytics View
          <ProgressAnalytics challenges={userData.challenges} />
        )}

        {/* Empty state when no challenges */}
        {userData.challenges.length === 0 && (
          <Fade in={true} timeout={800}>
            <Paper
              sx={{
                textAlign: 'center',
                py: 6,
                px: 4,
                mt: 4,
                borderRadius: 3,
                bgcolor: 'rgba(58, 134, 255, 0.03)',
                border: '1px dashed rgba(58, 134, 255, 0.3)'
              }}
            >
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: 'primary.main',
                  margin: '0 auto',
                  mb: 2
                }}
              >
                <FitnessCenterIcon />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                No Challenges Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '400px', mx: 'auto' }}>
                Start building resilience by adding your first challenge. Click the + button in the top-right corner to get started!
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Your First Challenge
              </Button>
            </Paper>
          </Fade>
        )}

        {/* Log Options Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleCloseLogMenu}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 180 }
          }}
        >
          <MenuItem onClick={handleEditLog} sx={{ py: 1.5 }}>
            <EditNoteIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            Edit Note
          </MenuItem>
          <MenuItem onClick={handleDeleteLog} sx={{ py: 1.5 }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
            Remove Log
          </MenuItem>
        </Menu>

        {/* Edit Log Dialog */}
        <Dialog
          open={editLogDialog}
          onClose={() => setEditLogDialog(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight={600}>Edit Log</Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Update your note for this day's challenge.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={4}
              margin="dense"
              label="Your Note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditLogDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEditedLog} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Daily Note Dialog */}
        <Dialog 
          open={dailyNoteDialog} 
          onClose={() => setDailyNoteDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <EditNoteIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Daily Reflection - {new Date().toLocaleDateString(undefined, { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric'
                })}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Record your thoughts, reflections, and how you felt today about your challenges.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={8}
              maxRows={15}
              variant="outlined"
              placeholder="How was your day? What did you learn? How did you feel?"
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(0, 0, 0, 0.01)'
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDailyNoteDialog(false)}>Cancel</Button>
            <Button onClick={handleDailyNoteSubmit} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset All Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ color: 'error.main' }}>Reset All Challenges</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone!
            </Alert>
            <Typography>
              Are you sure you want to reset all challenges? This will delete all your progress and return to the welcome page.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setResetDialogOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleResetAll} color="error" variant="contained">
              Reset All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Challenge Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ pb: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'error.light', width: 32, height: 32 }}>
                <WarningAmberIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Delete Challenge</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              This action cannot be undone!
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete this challenge? All progress and notes will be permanently lost.
            </Typography>
            {challengeToDelete && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mt: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {userData.challenges.find(c => c.id === challengeToDelete)?.name}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteChallenge} 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete Challenge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Challenge Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <FitnessCenterIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Add New Challenge</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define a new challenge to build your resilience muscles.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Challenge Name"
              fullWidth
              value={newChallenge.name}
              onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value.slice(0, 30) })}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 30 }}
              helperText={`${newChallenge.name.length}/30 characters`}
            />
            <TextField
              margin="dense"
              label="Duration (days)"
              type="number"
              fullWidth
              value={newChallenge.duration}
              onChange={(e) => setNewChallenge({ ...newChallenge, duration: e.target.value })}
              inputProps={{ min: 10 }}
              helperText="Challenge duration must be at least 10 days"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddChallenge} 
              variant="contained" 
              disabled={!newChallenge.name || !newChallenge.duration || parseInt(newChallenge.duration) < 10}
            >
              Add Challenge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Milestone Achievement Dialog */}
        <Dialog
          open={Boolean(showMilestone)}
          onClose={() => setShowMilestone(null)}
          PaperProps={{
            sx: { 
              borderRadius: 3,
              maxWidth: '400px',
              width: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
              position: 'relative',
              overflow: 'hidden'
            }
          }}
        >
          {showMilestone && (
            <>
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: `radial-gradient(circle at top right, ${showMilestone.milestone.color}15, transparent 70%)`,
                  zIndex: 0
                }}
              />
              <DialogContent sx={{ textAlign: 'center', py: 4, position: 'relative', zIndex: 1 }}>
                <Zoom in={true}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: `${showMilestone.milestone.color}15`,
                      color: showMilestone.milestone.color,
                      margin: '0 auto 16px',
                      border: `2px solid ${showMilestone.milestone.color}40`,
                    }}
                  >
                    {showMilestone.milestone.icon}
                  </Avatar>
                </Zoom>
                <Fade in={true} timeout={1000}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 700,
                        color: showMilestone.milestone.color
                      }}
                    >
                      {showMilestone.milestone.title}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {showMilestone.milestone.percentage}% Complete!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {showMilestone.milestone.description}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mt: 2, fontStyle: 'italic' }}
                    >
                      {userData.challenges.find(c => c.id === showMilestone.challengeId)?.name}
                    </Typography>
                  </Box>
                </Fade>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  onClick={() => setShowMilestone(null)}
                  variant="contained"
                  sx={{
                    bgcolor: showMilestone.milestone.color,
                    '&:hover': {
                      bgcolor: `${showMilestone.milestone.color}dd`
                    }
                  }}
                >
                  Keep Going!
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Update Duration Dialog */}
        <Dialog
          open={updateDurationDialog}
          onClose={() => setUpdateDurationDialog(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <DateRangeIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Update Challenge Duration</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set a new duration for your challenge. The duration must be at least 10 days and cannot be less than your completed days.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label="New Duration (days)"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              inputProps={{ min: 10 }}
              helperText="Minimum duration is 10 days"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setUpdateDurationDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateDuration}
              variant="contained"
              disabled={!newDuration || parseInt(newDuration) < 10}
            >
              Update Duration
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sign Out Dialog */}
        <Dialog
          open={signOutDialogOpen}
          onClose={() => setSignOutDialogOpen(false)}
          PaperProps={{
            sx: { borderRadius: 3, maxWidth: '500px', width: '100%' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <LogoutIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Sign Out</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to sign out? You can always sign back in later with your name.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSignOutDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={confirmSignOut} variant="contained" color="primary" startIcon={<LogoutIcon />}>
              Sign Out
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      
      {/* Custom Menu */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        {menuOpen && (
          <Grow in={menuOpen}>
            <Paper
              elevation={3}
              sx={{
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <Stack spacing={1} sx={{ p: 1 }}>
                {menuActions.map((action) => (
                  <ButtonBase
                    key={action.name}
                    onClick={() => {
                      setMenuOpen(false);
                      action.onClick();
                    }}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      overflow: 'hidden',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: action.color === 'error' ? 'error.light' : 'primary.light',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        width: '100%',
                        color: action.color === 'error' ? 'error.main' : 'primary.main',
                        '&:hover': {
                          color: action.color === 'error' ? 'white' : 'white',
                        }
                      }}
                    >
                      {action.icon}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          minWidth: 120
                        }}
                      >
                        {action.name}
                      </Typography>
                    </Box>
                  </ButtonBase>
                ))}
              </Stack>
            </Paper>
          </Grow>
        )}
        
        <Fab
          color="primary"
          onClick={() => setMenuOpen(!menuOpen)}
          sx={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #2ec4b6, #2a9d8f)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2a9d8f, #2ec4b6)'
            },
            boxShadow: '0 4px 20px rgba(46, 196, 182, 0.3)',
          }}
        >
          <MenuIcon />
        </Fab>
      </Box>
      
      {/* Wrap ChatAssistant in ErrorBoundary */}
      <ErrorBoundary>
        <ChatAssistant userData={userData} />
      </ErrorBoundary>
    </Container>
  );
};

export default DashboardPage; 