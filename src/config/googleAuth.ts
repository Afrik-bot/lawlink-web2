import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Add custom OAuth 2.0 scopes for Google sign-in
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Set custom OAuth parameters
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always prompt users to select their account
});

// Configure Google Sign-in behavior
export const googleSignInOptions = {
  // Request users' ID tokens
  signInOption: 'popup', // Use popup for sign-in
  callbacks: {
    signInSuccessWithAuthResult: (authResult: any) => {
      // Handle successful sign-in
      const isNewUser = authResult.additionalUserInfo?.isNewUser || false;
      const profile = authResult.additionalUserInfo?.profile;
      
      // You can handle new user registration differently
      if (isNewUser && profile) {
        // Store additional user data or trigger onboarding flow
        console.log('New user signed up with Google', {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });
      }
      
      // Return false to prevent redirect
      return false;
    },
  },
};
