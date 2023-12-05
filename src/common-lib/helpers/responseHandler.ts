// import customLogger from "../middleware/logger";

const responseHandler = require('express-response-handler')

// export default  {
//     forbiddenResponse: (res) => res.status(403).json({ code: 403 , message: 'User is not present in the context or is unauthorized'}),
//     notFoundResponse: (res) => res.status(404).json({ code: 404 , message: 'Requested resource is not available'}),
//     internalErrorResponse: (res,data) => res.status(500).json({ code: 500 , message: data || 'Something went wrong with the server response'}),
//     timeoutErrorResponse: (res) => res.status(504).json({ code: 504 , message: 'Requested resource is taking too long to respond'}),
//     getResponse: (res,data) => res.status(200).json(data || {}),
//     createResponse: (res,data) => res.status(201).json(data || {message: "Requested resource has been created."}),
//     deleteResponse: (res,data) => res.status(204).json(data || {message: "Requested resource has been deleted."}),
//     updateResponse: (res,data) => res.status(201).json(data || {message: "Requested resource has been updated"}),
//     badRequestResponse: (res,err) => res.status(400).json({ code: 400, message:`Bad Request: ${err}`})
// }

let customErrorCodes = [
	['BadRequest', 'error', 400],
	['Unauthorized', 'error', 401],
	['PaymentRequired', 'error', 402],
	['Forbidden', 'User is not present in the context or is unauthorized', 403],
	['NotFound', 'error', 404],
	['MethodNotAllowed', 'Method Yet to implement', 405],
	['NotAcceptable', 'error', 406],
	['RequestTimeout', 'error', 408],
	['Conflict', 'error', 409],
	['UnprocessableEntity', 'error', 422],
	['TooManyRequests', 'error', 429],
	['ServerError', 'error', 500],
	['NotImplemented', 'error', 501],
	['BadGateway', 'error', 502],
	['ServiceUnavailable', 'error', 503],
	['OK', 'success', 200],
	['Created', 'success', 201],
	['Accepted', 'success', 202],
	['NoContent', 'success', 204],
	['ResetContent', 'success', 205],
	['PartialContent', 'success', 206],
	['Default', 'error', 500],
]
const customResponseHandler = () => {
	return responseHandler(customErrorCodes)
}

export default customResponseHandler
