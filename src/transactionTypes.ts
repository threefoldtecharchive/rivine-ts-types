import { Input, Output, ResponseType, Response } from './types'
import { Fulfillment } from './fulfillmentTypes'
import { Condition } from './conditionTypes'

export enum TransactionType {
  DefaultTransaction,
  CoinCreationTransaction,
  MinterDefinitionTransaction
}

export abstract class Transaction extends Response {
  public version: number
  public id?: string

  // Optional block fields
  public blockId?: string
  public blockHeight?: number
  public blockTime?: number

  public extensionProperties?: Map<string, string>
  public arbitraryData?: string
  public unconfirmed?: boolean

  constructor (version: number) {
    super()
    this.version = version
  }

  public kind (): number {
    return ResponseType.Transaction
  }

  public abstract getTransactionType (): TransactionType
}

export class DefaultTransaction extends Transaction {
  public coinInputs?: Input[]
  public coinOutputs?: Output[]
  public blockStakeInputs?: Input[]
  public blockStakeOutputs?: Output[]

  constructor (version: number) {
    super(version)
  }

  public getTransactionType (): TransactionType {
    return TransactionType.DefaultTransaction
  }
}

export class CoinCreationTransaction extends Transaction {
  public coinCreationFulfillment: Fulfillment
  public coinCreationOutputs: Output[]

  constructor (version: number, coinCreationFulfillment: Fulfillment, coinCreationOutputs: Output[]) {
    super(version)
    this.coinCreationFulfillment = coinCreationFulfillment
    this.coinCreationOutputs = coinCreationOutputs
  }

  public getTransactionType (): TransactionType {
    return TransactionType.CoinCreationTransaction
  }
}

export class MinterDefinitionTransaction extends Transaction {
  public minterDefinitionFulfillment: Fulfillment
  public minterDefinitionCondition: Condition

  constructor (version: number, minterDefinitionFulfillment: Fulfillment, minterDefinitionCondition: Condition) {
    super(version)
    this.minterDefinitionFulfillment = minterDefinitionFulfillment
    this.minterDefinitionCondition = minterDefinitionCondition
  }

  public getTransactionType (): TransactionType {
    return TransactionType.MinterDefinitionTransaction
  }
}
