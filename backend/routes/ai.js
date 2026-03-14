const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const router = express.Router();

module.exports = (upload) => {
  router.post('/detect-crop', upload.single('image'), async (req, res) => {
    if (!req.file) {
      console.error("No file received in request");
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;

    try {
      if (!process.env.GEMINI_API_KEY) {
         console.warn("GEMINI_API_KEY is missing in .env. Falling back to mock response.");
         return res.json({
           crop_name: "Maize",
           health_status: "Healthy",
           disease_detected: "None",
           confidence_score: "94%",
           farming_recommendation: "Maintain current irrigation schedule and monitor for pests."
         });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const imageData = fs.readFileSync(imagePath);
      
      const parts = [
        { text: "Analyze the crop image and return structured agricultural information. Identify the crop, its health condition, any visible disease, confidence level, and a recommended farming action. Return output STRICTLY in JSON format with these exact keys: crop_name, health_status, disease_detected, confidence_score, farming_recommendation." },
        { inlineData: { data: imageData.toString('base64'), mimeType: req.file.mimetype } }
      ];

      console.log("Analyzing crop image with Gemini Vision SDK...");
      const result = await model.generateContent(parts);
      const response = await result.response;
      let text = response.text();
      
      console.log("Analysis Result:", text);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      try {
        const jsonResult = JSON.parse(text);
        res.json(jsonResult);
      } catch (parseErr) {
        console.error("JSON parsing failed. Raw response:", text);
        res.json({
          crop_name: "Unknown Plant",
          health_status: "Analysis complete",
          disease_detected: "N/A",
          confidence_score: "N/A",
          farming_recommendation: text.substring(0, 300)
        });
      }
    } catch (err) {
      console.error("Gemini Vision API Error:", err);
      res.status(500).json({ error: 'AI analysis failed' });
    } finally {
      // Clean up uploaded file
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete temp file:", imagePath, err);
      });
    }
  });

  return router;
};
