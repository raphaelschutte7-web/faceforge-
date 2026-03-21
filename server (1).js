const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Replicate = require('replicate');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static('../'));

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ROUTE : Génération image IA avec face swap
app.post('/api/generate', upload.single('photo'), async (req, res) => {
  try {
    const { templateEmoji } = req.body;
    const photoBuffer = req.file.buffer;
    const photoBase64 = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;

    console.log('🎨 Génération en cours...');

    // Face swap avec Replicate
    const output = await replicate.run(
      "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111",
      {
        input: {
          target_image: photoBase64,
          source_image: photoBase64,
        }
      }
    );

    console.log('✅ Image générée !');
    res.json({ success: true, imageUrl: output });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROUTE : Vérification paiement Stripe
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 99, // 0,99€ en centimes
      currency: 'eur',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
    });

    res.json({ success: true, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('🚀 FaceForge Backend démarré sur port 3000');
});
