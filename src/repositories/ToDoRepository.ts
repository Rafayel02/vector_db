import {Service} from "typedi";
import {ConnectionProvider} from "../utility/ConnectionProvider";
import {Client} from "@elastic/elasticsearch";
import {mappings} from "../constant/mappings";
import {InfoResponse, BulkOperationContainer, BulkResponse} from "@elastic/elasticsearch/lib/api/types";
import {TodoVector} from "../types/types";

@Service()
export class ToDoRepository {
    private static async getClient(): Promise<Client> {
        return (await ConnectionProvider.getInstance()).getClient()
    }

    public static async getInfo(): Promise<InfoResponse> {
        const client = await this.getClient()
        return client.info()
    }

    public static async createIndexIfNotExists(indexName: string): Promise<void> {
        const client = await this.getClient()
        const doesExist = await this.doesIndexExist(indexName)
        if (!doesExist) {
            client.indices
                .create({
                    index: indexName,
                    mappings
                })
                .then(() => console.log(`Successfully created index ${indexName}`))
                .catch(() => console.log(`Failed to create index ${indexName}`))
        } else {
            console.log("Index is already created, skipping index creation...")
        }
    }

    public static async doesIndexExist(indexName: string) {
        const client = await this.getClient()
        return await client.indices.exists({index: indexName});
    }

    public static async bulkInsertTodos(operations: (BulkOperationContainer | TodoVector)[]): Promise<BulkResponse> {
        const client = await this.getClient()
        return client.bulk({refresh: true, operations})
    }

    public static async searchTodos(indexName: string, queryVector: number[], limit: number): Promise<any> {
        const client = await this.getClient()
        const doesExist = await this.doesIndexExist(indexName)

        if (doesExist) {
            return client.search({
                index: indexName,
                knn: {
                    field: "vector",
                    query_vector: queryVector,
                    k: 40,
                    num_candidates: 1000
                },
                size: limit,
                sort: [
                    {
                        _score: {
                            order: "desc"
                        }
                    }
                ]
            })
        }

        return undefined
    }
}
