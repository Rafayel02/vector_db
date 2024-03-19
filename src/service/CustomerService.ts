import { Customer } from "../types/types";
import { CustomerRepository } from "../repositories/CustomerRepository";

export class CustomerService {

  public static async create(customerInfo: Customer): Promise<Customer> {
    await CustomerRepository.createIndexIfNotExists('customers')
    const customer = await CustomerRepository.getCustomerByDomain(customerInfo)

    if (customer) {
      return undefined
    }

    try {
      const res = await CustomerRepository.insertCustomer([{ index: { _index: 'customers' } }, customerInfo])
      if (res.errors) {
        return undefined
      }
      return await CustomerRepository.getCustomerByDomain(customerInfo)
    } catch (err) {
      console.log(err.toString())
    }

    return undefined
  }

  public static async getAllCustomers(): Promise<Customer[]> {
    return await CustomerRepository.getAllCustomers()
  }

  public static async deleteCustomer(domain: string): Promise<boolean> {
    await CustomerRepository.deleteCustomer(domain)
    return true
  }

}