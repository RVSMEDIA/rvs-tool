const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Your access token
const accessToken = 'e44b0dab087be2c41d020e6c467916ad:f6c9af767f18a86faae42e4b034e6ea49337e69bf4a717fdbd453ae255ff44c5';

// Endpoint to verify email
app.post('/verify-email', async (req, res) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const response = await axios.post(
            'https://api.leadrocks.io/v1/verify-instant',
            { email },
            {
                headers: {
                    'Authorization': accessToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while verifying the email address' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
