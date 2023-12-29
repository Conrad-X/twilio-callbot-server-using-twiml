const express = require("express");
const OpenAI = require('openai');
const app = express();
const server = require("http").createServer(app);

require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseURL = process.env.SERVER_BASE_URL
const systemPromptTemplate = "Given a user query, offer concise information about the user's query. \nIf there is any uncertainty, simply respond with 'Sorry,' and avoid providing unrelated information. \nDo not request additional details or clarifications."

// Initiating Twilio
const client = require('twilio')(accountSid, authToken);
const VoiceResponse = require('twilio').twiml.VoiceResponse;

// Initiating openAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
});


// Include Google Speech to Text
// const speech = require("@google-cloud/speech");
// const client = new speech.SpeechClient();

// const request = {
//     config: {
//       encoding: "MULAW",
//       sampleRateHertz: 8000,
//       languageCode: "en-GB",
//     },
//     interimResults: true, // If you want interim results, set this to true
//   };
  
// wss.on("connection", function connection(ws) {
// console.log("New Connection Initiated");

// let recognizeStream = null;

// ws.on("message", function incoming(message) {
//     const msg = JSON.parse(message);
//     switch (msg.event) {
//     case "connected":
//         console.log(`A new call has connected.`);
//         break;
//     case "start":
//         console.log(`Starting Media Stream ${msg.streamSid}`);
//         // Create Stream to the Google Speech to Text API
//         recognizeStream = client
//         .streamingRecognize(request)
//         .on("error", console.error)
//         .on("data", (data) => {
//             console.log(data.results[0].alternatives[0].transcript);
//             wss.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(
//                 JSON.stringify({
//                     event: "interim-transcription",
//                     text: data.results[0].alternatives[0].transcript,
//                 })
//                 );
//             }
//             });
//         });
//         break;
//     case "media":
//         // Write Media Packets to the recognize stream
//         recognizeStream.write(msg.media.payload);
//         break;
//     case "stop":
//         console.log(`Call Has Ended`);
//         recognizeStream.destroy();
//         break;
//     }
// });
// });



app.post("/transcribe", (req, res) => {
    const twiml = new VoiceResponse()

    twiml.say('Hey! ask me a question')

    twiml.gather({
        // enhanced: "true",
        speechTimeout: 0.5,
        speechModel: "phone_call",
        input: 'speech',
        action:`${baseURL}/respond`,
        method: 'GET'
    })
    res.send(twiml.toString())
});

app.get("/respond", async (req, res) => {
    // const openai = new OpenAI({ api_key: 'API_KEY'});
    const twiml = new VoiceResponse();
    console.log("User Transcript: ", req.query.SpeechResult);

    // Grab previous conversations and the users voice input from the request
    // let convo = event.convo;

    //Format input for GPT-3 and voice the response
    // convo += `\nYou: ${voiceInput}\nJoanna:`;
    var startDate = new Date();

    const aiResponse = await generateAIResponse(req.query.SpeechResult);
    console.log("AI Response: ", aiResponse);

    var endDate   = new Date();
    var seconds = (endDate.getTime() - startDate.getTime());
    console.log("Response Generation Time(s): ", seconds);

    // convo += aiResponse;
    // twiml.say({
    //     voice: 'Polly.Joanna-Neural'
    // }, aiResponse);

    twiml.say(aiResponse)
 
    twiml.redirect({
        method: 'POST'
    }, `${baseURL}/transcribe`);

    res.send(twiml.toString())
});

const generateAIResponse = async (userText) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {"role": "system", "content": systemPromptTemplate},
            {"role": "user", "content": userText},
        ],
      });

    return completion.choices[0].message.content
}

// app.post("/", (req, res) => {
//   res.set("Content-Type", "text/xml");

//   res.send(`
//     <Response>
//       <Start>
//         <Stream url="wss://${req.headers.host}/"/>
//       </Start>
//       <Say>I will stream the next 60 seconds of audio through your websocket</Say>
//       <Pause length="60" />
//     </Response>
//   `);
// });

app.post("/send-message", (req, res) => {
    client.messages
    .create({
        body: 'Hello from the other side',
        to: `+${process.env.TO_CALL_NUMBER}`, // Text your number
        from: `+${process.env.FROM_CALL_NUMBER}`, // From a valid Twilio number
    })
    .then((message) => {
        console.log(message.sid)
        res.status(203).send("Message Sent")
    });

})

app.post("/make-a-call", (req, res) => {
    client.calls
    .create({
        url: `${baseURL}/transcribe`,
        to: `+${process.env.TO_CALL_NUMBER}`, // Text your number
        from: `+${process.env.FROM_CALL_NUMBER}`, // From a valid Twilio number
    })
    .then(call => {
        console.log(call.sid)
        res.status(203).send("Calling...")
    })
})

app.get("/test", async (req, res) => {
    console.log("Success")
    res.status(200).send("Success")
})

app.get("/", async (req, res) => {
    console.log("Working");
    res.status(200).send("Working")
})

console.log("Listening on Port 8080");
server.listen(process.env.PORT || 5000);
