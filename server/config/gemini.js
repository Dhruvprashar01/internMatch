/**
 * config/gemini.js — Google Gemini AI Client
 *
 * BUG FIXED: "gemini-pro" is deprecated and returns 404.
 * Updated to "gemini-1.5-flash" — fast, cheap, and current.
 */
"use strict";

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

let _client = null;

const getClient = () => {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY env var not set");
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
};

// "gemini-pro" was deprecated in 2024 — use gemini-1.5-flash instead
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const getGeminiModel = (modelName = DEFAULT_MODEL) => {
  return getClient().getGenerativeModel({
    model: modelName,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature:     0.3,
      maxOutputTokens: 400,
      topP:            0.8,
    },
  });
};

module.exports = { getGeminiModel, DEFAULT_MODEL };