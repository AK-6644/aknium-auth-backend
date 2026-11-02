import express from 'express';
import cors from 'cors';
import { WorkOS } from '@workos-inc/node';

const app = express();
app.use(express.json()); // Parses incoming JSON requests from your frontend
app.use(cors()); // Enables CORS so Google Sites can communicate with this backend
app.use(express.static('.')); // Serves your static index.html frontend

// Initialize WorkOS securely using Render environment variables
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

// ----------------------------------------------------------------
// 1. SIGN-UP ENDPOINT: Creates user (WorkOS automatically sends code)
// ----------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const user = await workos.userManagement.createUser({
      email,
      password,
      firstName,
      lastName,
      emailVerified: false,
    });

    return res.status(200).json({
      success: true,
      message: 'User created! Verification code sent to email.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Check if the email already exists
    if (error.message && error.message.toLowerCase().includes('already exists')) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists. Please sign in instead.' 
      });
    }

    return res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------
// 2. VERIFY ENDPOINT: Authenticates the 6-digit code with WorkOS
// ----------------------------------------------------------------
app.post('/api/verify-code', async (req, res) => {
  const { code, pendingAuthenticationToken } = req.body;

  try {
    const { user, accessToken } = await workos.userManagement.authenticateWithCode({
      clientId: clientId,
      code: code,
      pendingAuthenticationToken: pendingAuthenticationToken,
      grantType: 'urn:workos:oauth:grant-type:email-verification:code',
    });

    return res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
      user,
      accessToken,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
