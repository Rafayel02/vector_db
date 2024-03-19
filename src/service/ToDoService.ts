import { Service } from "typedi"
import { ToDoRepository } from "../repositories/ToDoRepository"
import { ToDo, TodoVector, ToDoSearch, ToDoSearchRes } from "../types/types";
import {
  BulkResponse,
  InfoResponse,
  SearchResponse
} from "@elastic/elasticsearch/lib/api/types";
import env from "../configuration";
import { EncryptionService } from "./EncryptionService";

const transformersModule = import("@xenova/transformers")
const fetchModule = import("node-fetch")

@Service()
export class ToDoService {
  public static getInfo(): Promise<InfoResponse> {
    return ToDoRepository.getInfo()
  }

  public static async insertData(todos: ToDo[], secure: boolean = false, customerId: string): Promise<BulkResponse[]> {
    await ToDoRepository.createIndexIfNotExists(this.getIndexName(secure, customerId))

    const { pipeline } = await transformersModule
    const pipe: any = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    const { Headers } = await fetchModule
    const headers = new Headers()

    for (const todo of todos) {
      todo.name_encoded = await this.encodeValue(todo.name, pipe, headers);
    }

    return await this.bulkInsertDataByChunks(todos, secure, customerId)
  }

  public static async searchTodos(todo: ToDoSearch, secure: boolean = false, customerId: string): Promise<ToDoSearchRes[]> {
    const indexName = this.getIndexName(secure, customerId)
    const { pipeline } = await transformersModule
    const pipe: any = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    const { Headers } = await fetchModule
    const headers = new Headers()

    const encodedName: Float32Array = await this.encodeValue(todo.name, pipe, headers);
    const queryVector: number[] = this.makeQueryVector(encodedName)

    const result: SearchResponse = await ToDoRepository.searchTodos(indexName, queryVector, 2)

    if (!result) {
      return []
    }

    const finalResult: ToDoSearchRes[] = []
    for (const hit of result?.hits.hits) {
      const source = hit._source as ToDoSearchRes
      finalResult.push({
        id: hit._id,
        score: hit._score,
        index: hit._index,
        userFullName: secure ? await EncryptionService.decrypt(source.userFullName, customerId) : source.userFullName
      })
    }

    return finalResult
  }

  public static getIndexName(secure: boolean = false, customerId: string) {
    const baseName = `${env.elastic.name}-${customerId}`
    return secure ? `${baseName}-secure` : baseName
  }

  private static async bulkInsertDataByChunks(toDosToInsert: ToDo[], secure: boolean = false, customerId: string): Promise<BulkResponse[]> {
    const indexName = this.getIndexName(secure, customerId)
    const chunkSize = env.elastic.chunkSize

    const bulkResponses: BulkResponse[] = []
    for (let i = 0; i < toDosToInsert.length; i += chunkSize) {
      const chunk = toDosToInsert.slice(i, i + chunkSize)
      const bulkData = await this.makeElasticEntities(chunk, secure, customerId)
      const operationsAndData = bulkData.flatMap(
        doc => {
          return [{ index: { _index: indexName } }, doc]
        }
      )
      bulkResponses.push(await ToDoRepository.bulkInsertTodos(operationsAndData))
      console.log(`Index: ${indexName}: inserted chunk from ${i} to ${Math.min(i + chunkSize, toDosToInsert.length)}`)
    }

    return bulkResponses
  }

  private static async makeElasticEntities(toDos: ToDo[], secure: boolean = false, customerId: string): Promise<TodoVector[]> {
    const bulkData: TodoVector[] = []
    for (const todo of toDos) {
      let todoVector: TodoVector
      if (secure) {
        todoVector = {
          name: await EncryptionService.encrypt(todo.name, customerId),
          userFullName: await EncryptionService.encrypt(todo.userFullName, customerId),
          vector: this.makeQueryVector(todo.name_encoded)
        }
      } else {
        todoVector = {
          name: todo.name,
          userFullName: todo.userFullName,
          vector: this.makeQueryVector(todo.name_encoded)
        }
      }
      bulkData.push(todoVector)
    }
    return bulkData
  }

  private static makeQueryVector(nameEncoded: Float32Array): number[] {
    const vectorFields = [...nameEncoded]
    const vectorMagnitude = Math.sqrt(vectorFields.reduce((accumulator, field) => {
      return accumulator + field * field
    }, 0))
    return vectorFields.map(field => field / vectorMagnitude)
  }

  private static async encodeValue(value: string, pipe: any, headers: any): Promise<any> {
    const encodedValue = await pipe(value, { pooling: "mean", normalize: true, headers })
    return Object.values(encodedValue.data)
  }

}
