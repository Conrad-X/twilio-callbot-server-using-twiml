const VoiceResponse = require('twilio').twiml.VoiceResponse;
const stream = require('stream')
const utils = require('../utils/modules')

const baseURL = process.env.SERVER_BASE_URL

const transcribeService = () => {
    const twiml = new VoiceResponse()

    twiml.say('Hey! ask me a question')
    twiml.gather({
        // enhanced: "true",
        speechTimeout: 0.5, // Silence detection timeout
        speechModel: "phone_call",
        input: 'speech',
        action:`${baseURL}/respond`,
        method: 'GET'
    })

    return twiml.toString()
}

const respondService = async (SpeechResult, callback) => {
    const responseStream = new stream.Stream();
    callback(null, responseStream);

    const openAiResponse = await utils.openAI.generateAIResponse(SpeechResult);
    console.log(openAiResponse);
    let sentence = "", count = 0, twimlResponse = ""
    for await (const chunk of openAiResponse) {
        if (chunk.choices[0].finish_reason === 'stop') {
            twimlResponse = utils.helper.twilioFormatConvertor(`${baseURL}/transcribe`, "redirect&end")
            responseStream.emit('end', twimlResponse)
            // res.end(twilioFormatConvertor(`${baseURL}/transcribe`, "redirect&end"))
        } else {
            sentence += chunk.choices[0].delta.content + " "
            if (sentence.includes('.')) {
                console.log(sentence);
                twimlResponse = utils.helper.twilioFormatConvertor(sentence, count === 0 ? "start" : "middle")
                responseStream.emit('data', twimlResponse)
                // res.write(twilioFormatConvertor(text, count === 0 ? "start" : "middle"))
                sentence = ""
                count++
            }
        }
    }
}

const ringService = async () => {
    return await utils.twilio.ring()
}

module.exports = {
    transcribeService,
    respondService,
    ringService,
}