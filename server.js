import express from 'express';
import cors from 'cors';
import { WorkOS } from '@workos-inc/node';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {
    const user = await workos.userManagement.createUser({
      email, password, firstName, lastName, emailVerified: false,
    });
    await workos.userManagement.sendEmailVerification({ userId: user.id });
    return res.status(200).json({ success: true, message: 'Verification email sent!', userId: user.id });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/verify-code', async (req, res) => {
  const { code, pendingAuthenticationToken } = req.body;
  try {
    const { user, accessToken } = await workos.userManagement.authenticateWithCode({
      clientId, code, pendingAuthenticationToken,
      grantType: 'urn:workos:oauth:grant-type:email-verification:code',
    });
    return res.status(200).json({ success: true, user, accessToken });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
