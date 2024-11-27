import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import paymentService, { ConsultantPricing } from '../../services/PaymentService';

interface PackageFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
}

export const ConsultantPricingConfig: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [minimumDuration, setMinimumDuration] = useState(30);
  const [cancellationFee, setCancellationFee] = useState(0);
  const [packages, setPackages] = useState<PackageFormData[]>([]);
  const [openPackageDialog, setOpenPackageDialog] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<PackageFormData | null>(null);

  useEffect(() => {
    const loadPricing = async () => {
      if (!user) return;
      try {
        const pricing = await paymentService.getConsultantPricing(user.uid);
        if (pricing) {
          setHourlyRate(pricing.hourlyRate);
          setMinimumDuration(pricing.minimumDuration);
          setCancellationFee(pricing.cancellationFee);
          setPackages(pricing.customPackages);
        }
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const pricing: ConsultantPricing = {
        hourlyRate,
        minimumDuration,
        cancellationFee,
        customPackages: packages,
      };

      await paymentService.createConsultantPricing(user.uid, pricing);
    } catch (error) {
      console.error('Error saving pricing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPackage = () => {
    setCurrentPackage({
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      duration: 60,
      features: [],
    });
    setOpenPackageDialog(true);
  };

  const handleEditPackage = (pkg: PackageFormData) => {
    setCurrentPackage(pkg);
    setOpenPackageDialog(true);
  };

  const handleDeletePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  const handleSavePackage = () => {
    if (!currentPackage) return;

    if (packages.find(p => p.id === currentPackage.id)) {
      setPackages(packages.map(p => (p.id === currentPackage.id ? currentPackage : p)));
    } else {
      setPackages([...packages, currentPackage]);
    }

    setOpenPackageDialog(false);
    setCurrentPackage(null);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pricing Configuration
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Basic Pricing
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Hourly Rate ($)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Minimum Duration (minutes)"
                type="number"
                value={minimumDuration}
                onChange={(e) => setMinimumDuration(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Cancellation Fee ($)"
                type="number"
                value={cancellationFee}
                onChange={(e) => setCancellationFee(Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Custom Packages</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleAddPackage}
            >
              Add Package
            </Button>
          </Box>

          <List>
            {packages.map((pkg) => (
              <ListItem
                key={pkg.id}
                button
                onClick={() => handleEditPackage(pkg)}
              >
                <ListItemText
                  primary={pkg.name}
                  secondary={`$${pkg.price} - ${pkg.duration} minutes`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeletePackage(pkg.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </Box>

      <Dialog
        open={openPackageDialog}
        onClose={() => setOpenPackageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentPackage?.id ? 'Edit Package' : 'New Package'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Package Name"
              value={currentPackage?.name || ''}
              onChange={(e) =>
                setCurrentPackage(prev =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              value={currentPackage?.description || ''}
              onChange={(e) =>
                setCurrentPackage(prev =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              multiline
              rows={3}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Price ($)"
                  type="number"
                  value={currentPackage?.price || 0}
                  onChange={(e) =>
                    setCurrentPackage(prev =>
                      prev ? { ...prev, price: Number(e.target.value) } : null
                    )
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  value={currentPackage?.duration || 60}
                  onChange={(e) =>
                    setCurrentPackage(prev =>
                      prev ? { ...prev, duration: Number(e.target.value) } : null
                    )
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPackageDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePackage} variant="contained">
            Save Package
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultantPricingConfig;
