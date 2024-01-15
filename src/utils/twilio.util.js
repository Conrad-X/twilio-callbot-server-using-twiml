require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseURL = process.env.SERVER_BASE_URL

const twilioClient = require('twilio')(accountSid, authToken);

const ring = async () => {
    try {
        const call = await twilioClient.calls.create({
            url: `${baseURL}/transcribe`,
            to: `+${process.env.TO_CALL_NUMBER}`, // Text your number
            from: `+${process.env.FROM_CALL_NUMBER}`, // From a valid Twilio number
        })
        
        console.log("Calling..", call.sid)
        return call.sid
        // res.status(203).send("Calling...")
    } catch (err) {
        return err;
    }
}

module.exports = {
    ring,
}
