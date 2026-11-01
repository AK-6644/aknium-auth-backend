import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS so Google Sites can communicate with this backend
app.use(express.static('.')); // Serves your static index.html frontend

// ----------------------------------------------------------------
// 1. SIGN-UP ENDPOINT (Mocked for Lab Network)
// ----------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    console.log(`\n--- [MOCK WORKOS] ---`);
    console.log(`New user signup request for: ${email}`);
    console.log(`👉 Your mock 6-digit verification code is: 123456`);
    console.log(`---------------------\n`);

    return res.status(200).json({
      success: true,
      message:
        'User created! Check your terminal for the mock verification code.',
      userId: 'user_mock_12345',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------
// 2. VERIFY ENDPOINT (Mocked for Lab Network)
// ----------------------------------------------------------------
app.post('/api/verify-code', async (req, res) => {
  const { code } = req.body;

  try {
    if (code !== '123456') {
      return res.status(400).json({
        success: false,
        error:
          'Invalid verification code. For this mock demo, please use code: 123456',
      });
    }

    const mockUser = {
      object: 'user',
      id: 'user_mock_12345',
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'Lab',
      lastName: 'User',
    };

    return res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
      user: mockUser,
      accessToken: 'mock_access_token_abc123',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT} [CORS + Mock Mode Active]`
  );
});
