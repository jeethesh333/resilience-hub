import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { updateUserData } from '../services/firestore';

const ProfilePage: React.FC = () => {
  const { currentUser, updatePassword } = useAuth();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openNameDialog, setOpenNameDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password validation function
  const validatePassword = (password: string) => {
    const errors = {
      length: password.length < 8,
      uppercase: !/[A-Z]/.test(password),
      lowercase: !/[a-z]/.test(password),
      number: !/[0-9]/.test(password),
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = e.target.value;
    setNewPassword(newPass);
    validatePassword(newPass);
  };

  const handleUpdatePassword = async () => {
    if (!currentUser) return;

    // Reset states
    setError('');
    setSuccess('');

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('New password does not meet requirements');
      return;
    }

    try {
      setLoading(true);
      
      // First verify the old password by attempting to reauthenticate
      try {
        const credential = EmailAuthProvider.credential(currentUser.email!, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
      } catch (error) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      // If reauthentication successful, update the password
      await updatePassword(newPassword);
      
      setSuccess('Password updated successfully');
      setOpenPasswordDialog(false);
      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!currentUser || !newName.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      // Update display name in Firebase Auth
      await updateProfile(currentUser, {
        displayName: newName.trim()
      });

      // Update name in Firestore
      await updateUserData(currentUser.uid, { name: newName.trim() });
      
      setSuccess('Name updated successfully');
      setOpenNameDialog(false);
    } catch (error) {
      console.error('Error updating name:', error);
      setError('Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,248,255,1) 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: '#2ec4b6', 
              mx: 'auto',
              mb: 2
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Profile
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <AccountCircleIcon color="primary" />
              <Typography variant="h6">Name</Typography>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => {
                  setNewName(currentUser?.displayName || '');
                  setOpenNameDialog(true);
                }}
                sx={{ ml: 'auto' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Typography variant="body1" sx={{ mt: 1, ml: 4 }}>
              {currentUser?.displayName || 'No name set'}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <EmailIcon color="primary" />
              <Typography variant="h6">Email</Typography>
            </Stack>
            <Typography variant="body1" sx={{ mt: 1, ml: 4 }}>
              {currentUser?.email}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <LockIcon color="primary" />
              <Typography variant="h6">Password</Typography>
            </Stack>
            <Box sx={{ mt: 1, ml: 4 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ••••••••
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setOpenPasswordDialog(true)}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </Stack>

        {/* Name Update Dialog */}
        <Dialog 
          open={openNameDialog} 
          onClose={() => setOpenNameDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountCircleIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Update Name
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                autoFocus
                margin="normal"
                required
                fullWidth
                label="New Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, 20))}
                inputProps={{ maxLength: 20 }}
                helperText={`${newName.length}/20 characters`}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => {
                setOpenNameDialog(false);
                setNewName(currentUser?.displayName || '');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateName}
              variant="contained"
              disabled={loading || !newName.trim() || newName === currentUser?.displayName}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Name'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Update Dialog */}
        <Dialog 
          open={openPasswordDialog} 
          onClose={() => setOpenPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Update Password
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Current Password"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        edge="end"
                      >
                        {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handlePasswordChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {isPasswordFocused && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Password must contain:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <Typography variant="caption" component="li" color={passwordErrors.length ? "error.main" : "success.main"}>
                      At least 8 characters
                    </Typography>
                    <Typography variant="caption" component="li" color={passwordErrors.uppercase ? "error.main" : "success.main"}>
                      At least one uppercase letter
                    </Typography>
                    <Typography variant="caption" component="li" color={passwordErrors.lowercase ? "error.main" : "success.main"}>
                      At least one lowercase letter
                    </Typography>
                    <Typography variant="caption" component="li" color={passwordErrors.number ? "error.main" : "success.main"}>
                      At least one number
                    </Typography>
                    <Typography variant="caption" component="li" color={passwordErrors.special ? "error.main" : "success.main"}>
                      At least one special character
                    </Typography>
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => {
                setOpenPasswordDialog(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePassword}
              variant="contained"
              disabled={loading || !oldPassword || !newPassword || !confirmNewPassword}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 