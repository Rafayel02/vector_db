import env from "./configuration";
import app from "./app";
import {ConnectionProvider} from "./utility/ConnectionProvider";
import { VaultClient } from "./client/VaultClient";

ConnectionProvider.init().then(async () => {
    const appConfig = {
        port: parseInt(env.app.port),
        host: '0.0.0.0'
    }

    await VaultClient.getInstance().getSecrets()

    app.listen(appConfig, () => {
        console.log(`Server started at http://localhost:${env.app.port}`);
    })
})