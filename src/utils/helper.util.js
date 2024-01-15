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

module.exports = {
    twilioFormatConvertor,
}