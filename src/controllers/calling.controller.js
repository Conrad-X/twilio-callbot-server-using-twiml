const { transcribeService, respondService, ringService } =  require('../services/calling.services')

const transcribe = (req, res, next) => {
    try {
        res.send(transcribeService())
    } catch (err) {
        console.error("Error while transcribing user's voice: ", err)
        next(err)
    }
}

const respond = (req, res, next) => {
    try {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        respondService(req.query.SpeechResult, (err, stream) => {
            stream.on('data', (data) => {
                console.log(data);
                res.write(data)
            });
            stream.on('end', (data) => {
                console.log(data);
                res.end(data)
            }); 
        })
    } catch (err) {
        console.error("Error while responding to the user: ", err)
        next(err)
    }
}

const ring = async (req, res, next) => {
    try {
        res.send(await ringService())
    } catch (err) {
        console.error("Error while calling: ", err)
    }
}

module.exports = {
    transcribe,
    respond,
    ring,
}