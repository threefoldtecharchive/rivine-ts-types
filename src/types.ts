import { Decimal } from 'decimal.js'
import { Condition } from './conditionTypes'
import { Fulfillment } from './fulfillmentTypes'
import { Transaction } from './transactionTypes'

export enum ResponseType {
  Block,
  Transaction,
  Wallet,
  CoinOutputInfo,
  BlockstakeOutputInfo
}

export abstract class Response {
  public abstract kind (): number
}

export class Block extends Response {
  public id: string
  public height: number
  public timestamp: number
  public transactions: Transaction[]
  public minerFees?: MinerFee[]

  constructor (id: string, height: number, timestamp: number, transactions: Transaction[]) {
    super()
    this.id = id
    this.height = height
    this.timestamp = timestamp
    this.transactions = transactions
  }

  public kind (): number {
    return ResponseType.Block
  }
}

export class Wallet extends Response {
  public address: string

  // this identifier can tell us if the Wallet belong to a blockcreator
  public isBlockCreator: boolean

  public confirmedCoinBalance: Currency
  public lastCoinSpent?: LastSpent
  public confirmedBlockstakeBalance: Currency
  public lastBlockStakeSpent?: LastSpent

  public transactions?: Transaction[]
  public coinOutputs?: Output[]
  public minerPayouts?: Output[]
  public coinOutputsBlockCreator?: Output[]
  public blockStakesOutputsBlockCreator?: Output[]

  constructor (address: string, confirmedCoinBalance: Currency, confirmedBlockstakeBalance: Currency) {
    super()
    this.address = address
    this.confirmedCoinBalance = confirmedCoinBalance
    this.confirmedBlockstakeBalance = confirmedBlockstakeBalance

    // Set default to false
    this.isBlockCreator = false
  }

  public kind (): number {
    return ResponseType.Wallet
  }
}

export class CoinOutputInfo extends Response {
  public output: Output
  public input?: Input

  constructor (output: Output) {
    super()
    this.output = output
  }

  public kind (): number {
    return ResponseType.CoinOutputInfo
  }
}

export class BlockstakeOutputInfo extends Response {
  public output: Output
  public input?: Input

  constructor (output: Output) {
    super()
    this.output = output
  }

  public kind (): number {
    return ResponseType.BlockstakeOutputInfo
  }
}

export interface Input {
  parentid: string
  fulfillment: Fulfillment
  parentOutput?: Output
  txid?: string
}

export interface Output {
  value: Currency
  condition?: Condition
  id?: string
  spent?: boolean
  txId?: string
  blockId?: string
  isBlockCreatorReward?: boolean
  unlockhash?: string
}

export interface MinerFee {
  value: Currency
  unlockhash: string
  id: string
}

export interface LastSpent {
  txid: string
  height: number
}

export class Currency extends Decimal {
  public tokenPrecision: number

  constructor (n: string | number | Currency, tokenPrecision: number) {
    const value = new Decimal(n).dividedBy(tokenPrecision)
    super(value)
    this.tokenPrecision = tokenPrecision
  }
}
