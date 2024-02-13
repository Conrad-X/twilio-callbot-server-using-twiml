const express = require("express");
const OpenAI = require('openai');
const app = express();
const server = require("http").createServer(app);
var cors = require('cors');
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseURL = process.env.SERVER_BASE_URL
const systemPromptTemplate = "Given a user query, offer concise information about the user's query. \nIf there is any uncertainty, simply respond with 'Sorry,' and avoid providing unrelated information. \nDo not request additional details or clarifications."

// Initiating Twilio
const client = require('twilio')(accountSid, authToken);
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const callingRouter = require('./src/routes/calling.route')

// Initiating openAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
});

// Allow CORS
app.use(cors())

app.use('/call', callingRouter)

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(err.message, err.stack);
    res.status(statusCode).json({'message': err.message});
    
    return;
r});

const twilioFormatConvertor = (value, position) => {
    let returnValue = ""
    switch (position) {
        case "start":
            returnValue = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${value}</Say>`
            break;
        case "middle":
            returnValue = `<Say>${value}</Say>`
            break;
        case "redirect&end":
            returnValue = `<Redirect method="POST">${value}</Redirect></Response>`
            break; 
        case "end":
            returnValue = `<Say>${value}</Say></Response>`
            break;    
        default:
            return value
    }

    return returnValue;
}


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
    console.log("User Transcript: ", req.query.SpeechResult);
    var startDate = new Date();

    const response = await generateAIResponse(req.query.SpeechResult);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    let text = "", count = 0
    for await (const chunk of response) {
        if (chunk.choices[0].finish_reason === 'stop') {
            const twiml = new VoiceResponse()
            twiml.redirect({
                method: 'POST'
            }, `${baseURL}/transcribe`)
            // res.end(twiml.toString())
            res.end(twilioFormatConvertor(`${baseURL}/transcribe`, "redirect&end"))
        } else {
            text += chunk.choices[0].delta.content + " "
            if (text.includes('.')) {
                console.log(text);
                console.log("END");
                const twiml = new VoiceResponse()
                twiml.say(text)
                res.write(twilioFormatConvertor(text, count === 0 ? "start" : "middle"))
                // res.write(twiml.toString())
                text = ""
                count++
            }
        }
    }

    var endDate   = new Date();
    var seconds = (endDate.getTime() - startDate.getTime());
    console.log("Response Generation Time(s): ", seconds);
});

const generateAIResponse = async (userText) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        stream: true,
        messages: [
            {"role": "system", "content": systemPromptTemplate},
            {"role": "user", "content": userText},
        ],
    })

    return completion
}

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

app.get("/", async (req, res) => {
    console.log("Working");
    res.status(200).send("Working")
})

console.log("Listening on Port 8800");
server.listen(process.env.PORT || 8800)