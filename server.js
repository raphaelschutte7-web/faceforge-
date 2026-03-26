const express = require('express');
const Stripe = require('stripe');
const Replicate = require('replicate');
const cors = require('cors');
const multer = require('multer');

const server = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const upload = multer({ storage: multer.memoryStorage() });

server.use(cors({ origin: '*' }));
server.use(express.json());

// ROUTE 1 — Créer un paiement Stripe
server.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 99,
      currency: 'eur',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ROUTE 2 — Générer l'image IA
server.post('/generate', upload.single('photo'), async (req, res) => {
  try {
    const { templateName } = req.body;
    const photoBase64 = req.file.buffer.toString('base64');
    const photoDataUrl = `data:${req.file.mimetype};base64,${photoBase64}`;

    const output = await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695d048ec2c8f94a7e59c65e8ca",
      {
        input: {
          prompt: `Professional photo of a person as ${templateName}, hyper realistic, photographic quality, 4K`,
          input_image: photoDataUrl,
          style_name: "Photographic (Default)",
          num_outputs: 1,
        }
      }
    );

    res.json({ imageUrl: output[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
