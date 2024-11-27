import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import Register from '../../pages/auth/Register';
import authReducer from '../../store/slices/authSlice';
import theme from '../../theme';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  const renderRegister = () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form with all steps', () => {
    renderRegister();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  test('validates role selection step', async () => {
    renderRegister();
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(await screen.findByText('Please select a role')).toBeInTheDocument();
  });

  test('validates personal information step', async () => {
    renderRegister();
    // Select role
    const clientRole = screen.getByLabelText('I need legal consultation');
    fireEvent.click(clientRole);
    fireEvent.click(screen.getByText('Next'));

    // Try to proceed without filling fields
    fireEvent.click(screen.getByText('Next'));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
  });

  test('validates credentials step', async () => {
    renderRegister();
    // Complete first two steps
    const clientRole = screen.getByLabelText('I need legal consultation');
    fireEvent.click(clientRole);
    fireEvent.click(screen.getByText('Next'));

    const firstName = screen.getByLabelText('First Name');
    const lastName = screen.getByLabelText('Last Name');
    const phone = screen.getByLabelText('Phone Number');

    fireEvent.change(firstName, { target: { value: 'John' } });
    fireEvent.change(lastName, { target: { value: 'Doe' } });
    fireEvent.change(phone, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByText('Next'));

    // Try to submit without credentials
    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  test('validates password match', async () => {
    renderRegister();
    // Complete first two steps
    const clientRole = screen.getByLabelText('I need legal consultation');
    fireEvent.click(clientRole);
    fireEvent.click(screen.getByText('Next'));

    const firstName = screen.getByLabelText('First Name');
    const lastName = screen.getByLabelText('Last Name');
    const phone = screen.getByLabelText('Phone Number');

    fireEvent.change(firstName, { target: { value: 'John' } });
    fireEvent.change(lastName, { target: { value: 'Doe' } });
    fireEvent.change(phone, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByText('Next'));

    // Fill in credentials with mismatched passwords
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const confirmPassword = screen.getByLabelText('Confirm Password');

    fireEvent.change(email, { target: { value: 'john@example.com' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    fireEvent.change(confirmPassword, { target: { value: 'password456' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  test('successful registration flow', async () => {
    renderRegister();
    // Complete registration flow
    const clientRole = screen.getByLabelText('I need legal consultation');
    fireEvent.click(clientRole);
    fireEvent.click(screen.getByText('Next'));

    const firstName = screen.getByLabelText('First Name');
    const lastName = screen.getByLabelText('Last Name');
    const phone = screen.getByLabelText('Phone Number');

    fireEvent.change(firstName, { target: { value: 'John' } });
    fireEvent.change(lastName, { target: { value: 'Doe' } });
    fireEvent.change(phone, { target: { value: '1234567890' } });
    fireEvent.click(screen.getByText('Next'));

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    const confirmPassword = screen.getByLabelText('Confirm Password');

    fireEvent.change(email, { target: { value: 'john@example.com' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    fireEvent.change(confirmPassword, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
