import express from 'express';
import cors from 'cors';
import { WorkOS } from '@workos-inc/node';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Initialize WorkOS and Supabase using Render environment variables
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ----------------------------------------------------------------
// 1. SIGN-UP ENDPOINT
// ----------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const user = await workos.userManagement.createUser({
      email,
      password,
      firstName,
      lastName,
      emailVerified: true, // Instant verification
    });

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
      user,
    });
  } catch (error) {
    console.error('Signup error:', error);
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
// 2. SIGN-IN ENDPOINT (Exposes exact WorkOS error for debugging)
// ----------------------------------------------------------------
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, accessToken } = await workos.userManagement.authenticateWithPassword({
      clientId: clientId,
      email: email,
      password: password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully!',
      user,
      accessToken,
    });
  } catch (error) {
    console.error('Signin error details:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'Invalid email or password.' 
    });
  }
});

// ----------------------------------------------------------------
// 3. GET MUSIC ENDPOINT (Reads directly from Supabase Storage 'Songs' bucket)
// ----------------------------------------------------------------
app.get('/api/music', async (req, res) => {
  try {
    const { data: files, error } = await supabase
      .storage
      .from('Songs')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    const tracks = files
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => {
        const { data: publicUrlData } = supabase
          .storage
          .from('Songs')
          .getPublicUrl(file.name);

        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ");

        return {
          title: cleanTitle,
          fileName: file.name,
          audio_url: publicUrlData.publicUrl
        };
      });

    return res.status(200).json({
      success: true,
      tracks,
    });
  } catch (error) {
    console.error('Error fetching music from storage:', error);
    return res.status(500).json({ success: false, error: 'Failed to load music files from storage.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
