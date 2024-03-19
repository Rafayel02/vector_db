import {Client} from '@elastic/elasticsearch';
import env from "../configuration";

export class ConnectionProvider {
    private static instance: ConnectionProvider;
    private readonly _client: Client

    constructor(client: Client) {
        this._client = client;
    }

    getClient() {
        return this._client;
    }

    static async getInstance(): Promise<ConnectionProvider> {
        if (!ConnectionProvider.instance) {
            const client = new Client({
                node: env.elastic.dbUri,
                auth: {
                    apiKey: env.elastic.apiKey
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const response = await client.ping();
            if (response) {
                console.log('Connected to Elasticsearch was successful!');

            } else {
                console.log('Cannot connect to Elasticsearch.');
            }
            ConnectionProvider.instance = new ConnectionProvider(client);
        }
        return ConnectionProvider.instance;
    }

    static async init() {
        await ConnectionProvider.getInstance();
    }
}
