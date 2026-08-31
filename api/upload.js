const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `parts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, req, {
      access: 'public',
      contentType: contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Upload gagal' });
  }
};

module.exports.config = {
  api: { bodyParser: false },
};