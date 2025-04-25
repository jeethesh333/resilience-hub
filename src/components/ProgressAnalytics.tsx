import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Challenge } from '../types';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FlagIcon from '@mui/icons-material/Flag';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface ProgressAnalyticsProps {
  challenges: Challenge[];
}

type TimeRange = '7days' | '30days' | '90days' | 'all';

interface StreakGoal {
  days: number;
  achieved: boolean;
}

const DEFAULT_STREAK_GOALS = [7, 14, 30, 60, 90];

const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ challenges }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [compareMode, setCompareMode] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    title: string;
    data: any;
  }>({ open: false, title: '', data: null });
  const [streakGoals, setStreakGoals] = useState<StreakGoal[]>(() => {
    const saved = localStorage.getItem('streakGoals');
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_STREAK_GOALS.map(days => ({ days, achieved: false }));
  });
  const [newGoalDialog, setNewGoalDialog] = useState(false);
  const [newGoalDays, setNewGoalDays] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [exportDialog, setExportDialog] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; type: 'success' | 'info' }>({
    open: false,
    message: '',
    type: 'success'
  });

  // Calculate streaks
  const calculateStreaks = () => {
    const streaks = challenges.map(challenge => {
      let currentStreak = 0;
      let maxStreak = 0;
      let lastCompletedDay = -1;

      // Convert challenge notes to array of completed days
      const completedDays = Object.keys(challenge.notes)
        .map(day => parseInt(day))
        .sort((a, b) => a - b);

      completedDays.forEach(day => {
        if (lastCompletedDay === -1 || day === lastCompletedDay + 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastCompletedDay = day;
      });

      return {
        name: challenge.name,
        currentStreak,
        maxStreak,
      };
    });

    const currentStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
    
    // Check and update streak goals
    const updatedGoals = streakGoals.map(goal => ({
      ...goal,
      achieved: currentStreak >= goal.days && !goal.achieved
    }));

    // Show notification for newly achieved goals
    const newlyAchieved = updatedGoals.filter((goal, i) => 
      goal.achieved && !streakGoals[i].achieved
    );

    if (newlyAchieved.length > 0) {
      setNotification({
        open: true,
        message: `Congratulations! You've achieved your ${newlyAchieved[0].days}-day streak goal!`,
        type: 'success'
      });
      setStreakGoals(updatedGoals);
      localStorage.setItem('streakGoals', JSON.stringify(updatedGoals));
    }

    return {
      currentStreak,
      maxStreak: Math.max(...streaks.map(s => s.maxStreak), 0),
      bestChallenge: streaks.reduce((prev, current) => 
        current.maxStreak > prev.maxStreak ? current : prev
      , { name: '', maxStreak: 0 }).name,
      nextGoal: updatedGoals.find(g => !g.achieved)?.days || null
    };
  };

  // Filter challenges based on time range
  const filterByTimeRange = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return challenges.filter(challenge => new Date(challenge.startDate) >= cutoffDate);
  };

  const getFilteredChallenges = () => {
    switch (timeRange) {
      case '7days':
        return filterByTimeRange(7);
      case '30days':
        return filterByTimeRange(30);
      case '90days':
        return filterByTimeRange(90);
      default:
        return challenges;
    }
  };

  // Calculate completion rates for filtered challenges
  const completionRates = getFilteredChallenges().map(challenge => ({
    name: challenge.name,
    percentage: Math.floor((challenge.completedDays / challenge.duration) * 100)
  }));

  // Calculate daily completion trends
  const getDailyCompletionData = () => {
    const daysToShow = timeRange === '7days' ? 7 : 
                      timeRange === '30days' ? 30 :
                      timeRange === '90days' ? 90 : 
                      Math.min(90, Math.max(...challenges.map(c => c.completedDays)));

    // Create array of dates from today backwards
    const dates = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date();
      // Don't subtract days for index 0 (today)
      if (i > 0) {
        date.setDate(date.getDate() - (i - 1));
      }
      return date.toISOString().split('T')[0];
    }).sort(); // Sort to ensure chronological order

    const completionCounts = dates.map(date => {
      return challenges.reduce((count, challenge) => {
        const startDate = new Date(challenge.startDate);
        const targetDate = new Date(date);
        
        // Calculate days since challenge started
        const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if this challenge has a note for this day (1-indexed in notes)
        const hasCompletedThisDay = challenge.notes[daysDiff + 1] ? 1 : 0;
        
        return count + hasCompletedThisDay;
      }, 0);
    });

    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }),
      data: completionCounts
    };
  };

  // Calculate overall progress distribution
  const getProgressDistribution = () => {
    const categories = {
      'Not Started (0%)': 0,
      'Just Started (1-25%)': 0,
      'In Progress (26-75%)': 0,
      'Almost Done (76-99%)': 0,
      'Completed (100%)': 0
    };

    getFilteredChallenges().forEach(challenge => {
      const progress = (challenge.completedDays / challenge.duration) * 100;
      if (progress === 0) categories['Not Started (0%)']++;
      else if (progress <= 25) categories['Just Started (1-25%)']++;
      else if (progress <= 75) categories['In Progress (26-75%)']++;
      else if (progress < 100) categories['Almost Done (76-99%)']++;
      else categories['Completed (100%)']++;
    });

    return {
      labels: Object.keys(categories),
      data: Object.values(categories)
    };
  };

  // Compare data between periods
  const getComparisonData = () => {
    const currentPeriod = getFilteredChallenges();
    const previousPeriod = filterByTimeRange(
      timeRange === '7days' ? 14 : 
      timeRange === '30days' ? 60 :
      timeRange === '90days' ? 180 : 
      365
    ).slice(0, currentPeriod.length);

    return {
      currentPeriod: {
        completionRate: currentPeriod.reduce((acc, c) => 
          acc + (c.completedDays / c.duration), 0) / currentPeriod.length * 100,
        totalCompleted: currentPeriod.filter(c => 
          (c.completedDays / c.duration) * 100 === 100).length
      },
      previousPeriod: {
        completionRate: previousPeriod.reduce((acc, c) => 
          acc + (c.completedDays / c.duration), 0) / previousPeriod.length * 100,
        totalCompleted: previousPeriod.filter(c => 
          (c.completedDays / c.duration) * 100 === 100).length
      }
    };
  };

  const streakData = calculateStreaks();
  const dailyData = getDailyCompletionData();
  const distributionData = getProgressDistribution();

  // Create streaks array from challenges for use in the details dialog
  const streaks = challenges.map(challenge => {
    let currentStreak = 0;
    let maxStreak = 0;
    let lastCompletedDay = -1;

    const completedDays = Object.keys(challenge.notes)
      .map(day => parseInt(day))
      .sort((a, b) => a - b);

    completedDays.forEach(day => {
      if (lastCompletedDay === -1 || day === lastCompletedDay + 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      lastCompletedDay = day;
    });

    return {
      name: challenge.name,
      currentStreak,
      maxStreak,
    };
  });

  // Chart configurations
  const completionRateChart = {
    labels: completionRates.map(c => c.name),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: completionRates.map(c => c.percentage),
        backgroundColor: 'rgba(58, 134, 255, 0.8)',
        borderColor: 'rgba(58, 134, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  const dailyCompletionChart = {
    labels: dailyData.labels,
    datasets: [
      {
        label: 'Challenges Completed',
        data: dailyData.data,
        fill: true,
        borderColor: 'rgba(131, 56, 236, 1)',
        backgroundColor: 'rgba(131, 56, 236, 0.1)',
        tension: 0.4
      }
    ]
  };

  const progressDistributionChart = {
    labels: distributionData.labels,
    datasets: [
      {
        data: distributionData.data,
        backgroundColor: [
          '#ff6b6b',
          '#ffd93d',
          '#6c757d',
          '#4dabf7',
          '#51cf66'
        ],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}${context.dataset.label?.includes('%') ? '%' : ''}`;
          }
        }
      },
      onClick: (_: any, elements: any) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const datasetLabel = elements[0].dataset.label;
          
          if (datasetLabel === 'Completion Rate (%)') {
            const challenge = completionRates[index];
            setDetailsDialog({
              open: true,
              title: challenge.name,
              data: {
                completionRate: challenge.percentage,
                streak: streaks.find((s: { name: string }) => s.name === challenge.name)
              }
            });
          } else if (datasetLabel === 'Challenges Completed') {
            const date = dailyData.labels[index];
            const completedCount = dailyData.data[index];
            setDetailsDialog({
              open: true,
              title: `Completion Details - ${date}`,
              data: {
                date,
                completedCount,
                challenges: challenges.filter(c => {
                  const challengeDate = new Date(c.startDate);
                  challengeDate.setDate(challengeDate.getDate() + index);
                  return c.notes[index + 1];
                })
              }
            });
          }
        }
      }
    }
  };

  // Enhanced export functionality
  const handleExport = async () => {
    const data = {
      timeRange,
      streaks: streakData,
      completionRates,
      dailyCompletion: {
        dates: dailyData.labels,
        counts: dailyData.data
      },
      progressDistribution: {
        categories: distributionData.labels,
        counts: distributionData.data
      },
      comparison: compareMode ? getComparisonData() : null
    };

    // Get current date in YYYY-MM-DD format without timezone issues
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    switch (exportFormat) {
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = jsonUrl;
        a.download = `resilience-analytics-${dateString}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(jsonUrl);
        break;

      case 'csv':
        let csvContent = 'data:text/csv;charset=utf-8,';
        // Add completion rates
        csvContent += 'Challenge Name,Completion Rate (%)\n';
        completionRates.forEach(({ name, percentage }) => {
          csvContent += `${name},${percentage}\n`;
        });
        // Add daily completion
        csvContent += '\nDate,Completed Challenges\n';
        dailyData.labels.forEach((date, i) => {
          csvContent += `${date},${dailyData.data[i]}\n`;
        });
        const csvUrl = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', csvUrl);
        link.setAttribute('download', `resilience-analytics-${dateString}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;

      case 'pdf':
        try {
          // Create a new PDF document
          const doc = new jsPDF();
          
          // Add title
          doc.setFontSize(20);
          doc.text('Resilience Analytics Report', 105, 20, { align: 'center' });
          
          // Add date
          doc.setFontSize(12);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
          
          // Add streak information
          doc.setFontSize(14);
          doc.text('Streak Information', 20, 45);
          doc.setFontSize(12);
          doc.text(`Current Streak: ${streakData.currentStreak} days`, 20, 55);
          doc.text(`Best Streak: ${streakData.maxStreak} days`, 20, 65);
          doc.text(`Most Consistent Challenge: ${streakData.bestChallenge || 'None'}`, 20, 75);
          
          // Add completion rates table
          const tableData = completionRates.map(c => [c.name, `${c.percentage}%`]);
          doc.autoTable({
            head: [['Challenge', 'Completion Rate']],
            body: tableData,
            startY: 85,
            headStyles: { fillColor: [46, 196, 182] },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 }
          });
          
          // Save the PDF
          const filename = `resilience-analytics-${dateString}.pdf`;
          doc.save(filename);
          
          // Show success notification
          setNotification({
            open: true,
            message: 'PDF exported successfully!',
            type: 'success'
          });
        } catch (error) {
          console.error('PDF export error:', error);
          setNotification({
            open: true,
            message: 'Failed to export PDF. Please try again.',
            type: 'info'
          });
        }
        break;
    }
    
    setExportDialog(false);
    setNotification({
      open: true,
      message: `Analytics exported successfully as ${exportFormat.toUpperCase()}`,
      type: 'success'
    });
  };

  return (
    <Box sx={{ py: 4 }}>
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Progress Analytics
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={compareMode}
            exclusive
            onChange={(_, value) => setCompareMode(value)}
            size="small"
          >
            <ToggleButton value={true}>
              <Tooltip title="Compare Periods">
                <CompareArrowsIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export Analytics">
            <IconButton onClick={() => setExportDialog(true)} color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Streak Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LocalFireDepartmentIcon />
                <Typography variant="h6">
                  Current Streak
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setNewGoalDialog(true)}
                  sx={{ ml: 'auto' }}
                >
                  <FlagIcon />
                </IconButton>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {streakData.currentStreak} days
              </Typography>
              {streakData.nextGoal && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Next goal: {streakData.nextGoal} days
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(streakData.currentStreak / streakData.nextGoal) * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EmojiEventsIcon />
                <Typography variant="h6">
                  Best Streak
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {streakData.maxStreak} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WhatshotIcon />
                <Typography variant="h6">
                  Most Consistent
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {streakData.bestChallenge || 'No challenges yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Challenges
              </Typography>
              <Typography variant="h3" color="primary">
                {getFilteredChallenges().length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Challenges
              </Typography>
              <Typography variant="h3" color="secondary">
                {getFilteredChallenges().filter(c => (c.completedDays / c.duration) * 100 < 100).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Challenges
              </Typography>
              <Typography variant="h3" sx={{ color: 'success.main' }}>
                {getFilteredChallenges().filter(c => (c.completedDays / c.duration) * 100 === 100).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Section */}
        {compareMode && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Period Comparison
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Period
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Average Completion Rate
                          </Typography>
                          <Typography variant="h4">
                            {Math.round(getComparisonData().currentPeriod.completionRate)}%
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Challenges Completed
                          </Typography>
                          <Typography variant="h4">
                            {getComparisonData().currentPeriod.totalCompleted}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Previous Period
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Average Completion Rate
                          </Typography>
                          <Typography variant="h4">
                            {Math.round(getComparisonData().previousPeriod.completionRate)}%
                          </Typography>
                          <Chip 
                            label={`${getComparisonData().currentPeriod.completionRate > getComparisonData().previousPeriod.completionRate ? '+' : ''}${
                              Math.round((getComparisonData().currentPeriod.completionRate - getComparisonData().previousPeriod.completionRate) * 10) / 10
                            }%`}
                            color={getComparisonData().currentPeriod.completionRate >= getComparisonData().previousPeriod.completionRate ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Challenges Completed
                          </Typography>
                          <Typography variant="h4">
                            {getComparisonData().previousPeriod.totalCompleted}
                          </Typography>
                          <Chip 
                            label={`${getComparisonData().currentPeriod.totalCompleted > getComparisonData().previousPeriod.totalCompleted ? '+' : ''}${
                              getComparisonData().currentPeriod.totalCompleted - getComparisonData().previousPeriod.totalCompleted
                            }`}
                            color={getComparisonData().currentPeriod.totalCompleted >= getComparisonData().previousPeriod.totalCompleted ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Charts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Challenge Completion Rates
            </Typography>
            <Bar data={completionRateChart} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Daily Completion Trend
            </Typography>
            <Line data={dailyCompletionChart} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Progress Distribution
            </Typography>
            <Doughnut data={progressDistributionChart} options={chartOptions} />
          </Paper>
        </Grid>
      </Grid>

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, title: '', data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{detailsDialog.title}</DialogTitle>
        <DialogContent>
          {detailsDialog.data && (
            <Box sx={{ py: 2 }}>
              {detailsDialog.data.completionRate !== undefined ? (
                // Challenge details
                <Stack spacing={2}>
                  <Typography variant="body1">
                    Completion Rate: {detailsDialog.data.completionRate}%
                  </Typography>
                  <Typography variant="body1">
                    Current Streak: {detailsDialog.data.streak?.currentStreak || 0} days
                  </Typography>
                  <Typography variant="body1">
                    Best Streak: {detailsDialog.data.streak?.maxStreak || 0} days
                  </Typography>
                </Stack>
              ) : (
                // Daily completion details
                <Stack spacing={2}>
                  <Typography variant="body1">
                    Date: {detailsDialog.data.date}
                  </Typography>
                  <Typography variant="body1">
                    Completed Challenges: {detailsDialog.data.completedCount}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Completed:
                  </Typography>
                  {detailsDialog.data.challenges.map((challenge: Challenge) => (
                    <Chip 
                      key={challenge.id}
                      label={challenge.name}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, title: '', data: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Goal Dialog */}
      <Dialog 
        open={newGoalDialog} 
        onClose={() => setNewGoalDialog(false)}
      >
        <DialogTitle>Set New Streak Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Days"
            type="number"
            fullWidth
            value={newGoalDays}
            onChange={(e) => setNewGoalDays(e.target.value)}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGoalDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              const days = parseInt(newGoalDays);
              if (days > 0) {
                setStreakGoals([...streakGoals, { days, achieved: false }].sort((a, b) => a.days - b.days));
                localStorage.setItem('streakGoals', JSON.stringify(streakGoals));
                setNewGoalDialog(false);
                setNewGoalDays('');
              }
            }}
            color="primary"
          >
            Add Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialog} 
        onClose={() => setExportDialog(false)}
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#2ec4b6', 
          color: 'white',
          fontWeight: 600,
          pb: 2,
          pt: 2
        }}>
          Export Analytics
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 3,
          px: 3
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a format to export your analytics data
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              label="Format"
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
            >
              <MenuItem value="json">JSON - Raw data</MenuItem>
              <MenuItem value="csv">CSV - Spreadsheet compatible</MenuItem>
              <MenuItem value="pdf">PDF - Printable report</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          pb: 3,
          pt: 2 
        }}>
          <Button onClick={() => setExportDialog(false)} sx={{ color: '#f9844a' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            sx={{ 
              bgcolor: '#2ec4b6',
              '&:hover': {
                bgcolor: '#2a9d8f'
              }
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgressAnalytics; 