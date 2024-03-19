import {FastifyInstance} from "fastify";
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import sensible from '@fastify/sensible'
import { customerValidator } from "../interceptor";

export const configureMiddleware = (app: FastifyInstance) => {
    app.register(helmet, {contentSecurityPolicy: false})
    app.addHook('onRequest', customerValidator)
    app.register(compress)
    app.register(sensible)
};
