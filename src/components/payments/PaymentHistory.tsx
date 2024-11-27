import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Receipt,
  MoreVert,
  GetApp,
  Refresh,
  Info
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  type: 'consultation' | 'document_review' | 'retainer' | 'other';
  description?: string;
  createdAt: Date;
  client: {
    _id: string;
    name: string;
  };
  consultant: {
    _id: string;
    name: string;
  };
}

interface PaymentHistoryProps {
  userId: string;
  userType: 'client' | 'consultant';
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId, userType }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadPayments();
  }, [userId, userType]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/payments', {
        params: {
          userId,
          userType,
          page,
          limit: rowsPerPage
        }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    loadPayments();
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    loadPayments();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    setSelectedPayment(payment);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPayment(null);
  };

  const handleDownloadReceipt = async () => {
    if (!selectedPayment) return;

    try {
      const response = await axios.get(`/api/payments/${selectedPayment._id}/receipt`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${selectedPayment._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
    handleMenuClose();
  };

  const handleRequestRefund = async () => {
    if (!selectedPayment) return;

    try {
      await axios.post(`/api/payments/${selectedPayment._id}/refund`);
      loadPayments();
    } catch (error) {
      console.error('Failed to request refund:', error);
    }
    handleMenuClose();
  };

  const getStatusChipColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  return (
    <Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>{userType === 'client' ? 'Consultant' : 'Client'}</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No payment history found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      {payment.type.replace('_', ' ').charAt(0).toUpperCase() +
                        payment.type.slice(1)}
                    </TableCell>
                    <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={getStatusChipColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {userType === 'client'
                        ? payment.consultant.name
                        : payment.client.name}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, payment)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownloadReceipt}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Receipt</ListItemText>
        </MenuItem>
        {selectedPayment?.status === 'completed' &&
          userType === 'client' && (
            <MenuItem onClick={handleRequestRefund}>
              <ListItemIcon>
                <Refresh fontSize="small" />
              </ListItemIcon>
              <ListItemText>Request Refund</ListItemText>
            </MenuItem>
          )}
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PaymentHistory;
