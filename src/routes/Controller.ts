import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ToDoService } from "../service/ToDoService";
import { Customer, ToDo, ToDoSearch } from "../types/types";
import { CustomerService } from "../service/CustomerService";

export function registerRoutes(app: FastifyInstance) {
  app.get('/', async function (request, reply) {
    return {
      author: 'Rafael Shakhnazarian',
      service: 'Vector DB security (Payload encoding)'
    }
  })

  app.post('/registerCustomer', async function (request, reply) {
    const customer: Customer = request.body as Customer
    const createdCustomer = await CustomerService.create(customer)

    if (!createdCustomer) {
      return reply.code(400).send({ error: `Customer with domain '${customer.domain}' already exists` })
    }

    return {
      info: `New customer was added with id ${createdCustomer.id}`
    }
  })

  app.get('/getAllCustomers', async function (request, reply) {
    return {
      info: await CustomerService.getAllCustomers()
    }
  })

  app.post('/deleteCustomer', async function (request, reply) {
    const customer: Customer = request.body as Customer

    return {
      deleted: await CustomerService.deleteCustomer(customer.domain)
    }
  })

  app.post("/todo/search", async function (request) {
    const { secure } = request.query as { secure: boolean }
    const todo: ToDoSearch = request.body as ToDoSearch
    if (!todo.name) {
      return 'Name field is required'
    }
    const domain = request.headers['customer-domain'].toString()
    return ToDoService.searchTodos(todo, secure, domain)
  })

  app.post("/todo/insert", async function (request: FastifyRequest, reply: FastifyReply) {
    const { secure } = request.query as { secure: boolean }
    const todos: ToDo[] = request.body as ToDo[]
    if (!todos) {
      return 'No todos provided'
    }

    const domain = request.headers['customer-domain'].toString()

    todos.forEach(todo => {
      if (!todo.name) {
        return "Invalid todo name was provided"
      }
      if (!todo.userFullName) {
        return "Invalid user fullName was provided"
      }
    })

    try {
      return ToDoService.insertData(todos, secure, domain)
    } catch (e: any) {
      reply.code(400).send({
        error: e.message
      })
    }
  })
}
