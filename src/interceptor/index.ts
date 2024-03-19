import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { HttpStatusCode } from "axios";
import env from "../configuration"
import { CustomerRepository } from "../repositories/CustomerRepository";
import { ToDoRepository } from "../repositories/ToDoRepository";
import { ToDoService } from "../service/ToDoService";

export const customerValidator = (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  if (env.allowedPaths.includes(req.routeOptions.url)) {
    done()
    return
  }
  let domain: any = req.headers['customer-domain']

  if (!domain) {
    return reply.code(HttpStatusCode.BadRequest).send({
      code: HttpStatusCode.BadRequest,
      error: 'Header customer-domain is not set',
    })
  }
  domain = domain.toString()

  CustomerRepository.getCustomerByDomain({ domain, name: domain }).then(async c => {
    if (c) {
      return done()
    } else {
      return reply.code(HttpStatusCode.BadRequest).send({
        code: HttpStatusCode.BadRequest,
        error: `Customer does not exist with domain ${domain}`,
      })
    }
  }).catch(e => {
    return reply.code(HttpStatusCode.BadRequest).send({
      code: HttpStatusCode.BadRequest,
      error: `Customer does not exist with id ${domain}`,
    })
  })
}