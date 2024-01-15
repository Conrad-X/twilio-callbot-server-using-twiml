const OpenAI = require('openai');
const general = require('../configs/general.config')
require("dotenv").config();

// Initiating openAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

const generateAIResponse = async (userText) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        stream: true,
        messages: [
            { "role": "system", "content": general.systemPrompt },
            { "role": "user", "content": userText },
        ],
      })

    return completion
}

module.exports = {
    generateAIResponse,
}