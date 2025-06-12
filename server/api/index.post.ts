import { JSONRPCServer } from 'json-rpc-2.0'
import user from '../methods/user'
import report from '../methods/report'
import question from '../methods/question'
import payment from '../methods/payment'

const server = new JSONRPCServer()

// User
server.addMethod('user.add', user.add)
server.addMethod('user.closeWebAppSession', user.closeWebAppSession)
server.addMethod('user.upsertUserProfile', user.upsertUserProfile)
server.addMethod('user.getUserProfile', user.getUserProfile)

// Report
server.addMethod('report.create', report.create)

// Question
server.addMethod('question.create', question.create)

// Payment
server.addMethod('payment.create', payment.create)

export default eventHandler(async event => {
  const jsonRPCRequest = await readBody(event)

  // server.receive takes a JSON-RPC request and returns a promise of a JSON-RPC response.
  // It can also receive an array of requests, in which case it may return an array of responses.
  // Alternatively, you can use server.receiveJSON, which takes JSON string as is (in this case req.body).
  const jsonRPCResponse = await server.receive(jsonRPCRequest)

  if (jsonRPCResponse) {
    return jsonRPCResponse
  } else {
    // If response is absent, it was a JSON-RPC notification method.
    // Respond with no content status (204).
    return 204
  }
})
