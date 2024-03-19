import {fastify} from 'fastify'
import {useContainer as validatorContainer} from "class-validator";
import {
    useContainer as routingContainer,
} from "routing-controllers";
import {Container} from "typedi";
import {configureMiddleware} from "./middleware";
import {registerRoutes} from "./routes/Controller";
import cors from '@fastify/cors'

routingContainer(Container);
validatorContainer(Container, {
    fallbackOnErrors: true,
});

const app = fastify()
app.register(cors, {
    origin: 'http://localhost:3000'
})

configureMiddleware(app);
registerRoutes(app);

export default app;
