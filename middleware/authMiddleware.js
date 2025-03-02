const dotenv = require('dotenv');
dotenv.config();

const apiKeyAuth = (req, res, next) => {
  const clientKey = req.headers["x-api-key"];
  const origin = req.headers.origin;
   

  // Check if the request is coming from the same origin
  const sameOrigin = !origin || origin.includes(process.env.BASE_URL);  // If no origin header, assume same-origin
  if (req.originalUrl === '/auth/payment') {
    return next(); // Skip adding custom header and move to the next middleware or route handler
  }
  if (sameOrigin) {
    // console.log('Same-origin request, skipping API key check');
    return next();
  }



  // If it's a cross-origin request, check the API key
  if (!clientKey || clientKey !== process.env.GLOBAL_SECRET_KEY) {
    console.log('Invalid or missing API key');

    return res.status(403).json({ message: "Forbidden: Invalid API Key" });
  }

  next();

};

module.exports = apiKeyAuth;

