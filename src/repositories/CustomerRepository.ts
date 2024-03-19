import { Service } from "typedi";
import { ConnectionProvider } from "../utility/ConnectionProvider";
import { Client } from "@elastic/elasticsearch";
import { InfoResponse, BulkOperationContainer, BulkResponse, DeleteByQueryResponse } from "@elastic/elasticsearch/lib/api/types";
import { Customer, TodoVector } from "../types/types";
import { mappings } from "../constant/CustomerMappings";

@Service()
export class CustomerRepository {
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
        .catch((e) => console.log(`Failed to create index ${indexName}`, e))
    } else {
      console.log("Index is already created, skipping index creation...")
    }
  }

  public static async doesIndexExist(indexName: string) {
    const client = await this.getClient()
    return await client.indices.exists({ index: indexName });
  }

  public static async insertCustomer(operations: (BulkOperationContainer | Customer)[]): Promise<BulkResponse> {
    const client = await this.getClient()
    return client.bulk({ refresh: true, operations })
  }

  public static async deleteCustomer(domain: string): Promise<DeleteByQueryResponse> {
    const client = await this.getClient()

    return client.deleteByQuery(
      {
        index: 'customers',
        query: {
          match: {
            domain: domain
          }
        }
      })
  }

  public static async getAllCustomers(): Promise<Customer[]> {
    const client: Client = await this.getClient()

    try {
      const response = await client.search({ index: 'customers' })

      const res = response?.hits.hits
      const customers = []
      if (res && res.length) {
        for (let cm of res) {
          const tempCustomer: Customer = cm._source as Customer
          tempCustomer.id = cm._id
          customers.push(tempCustomer)
        }
        return customers
      }
    } catch (error) {
      console.error('Error while getting customer', error);
    }
    return []
  }

  public static async getCustomerByDomain(customerInfo: Customer): Promise<Customer> {
    const client = await this.getClient()

    try {
      const response = await client.search({
        index: 'customers',
        query: {
          match: {
            domain: customerInfo.domain
          }
        }
      });

      const res = response?.hits.hits
      if (res && res.length) {
        const customer: Customer = res[0]._source as Customer
        customer.id = res[0]._id
        return customer
      }
    } catch (error) {
      console.error('Error while getting customer', error);
    }
    return undefined
  }
}
