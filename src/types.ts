import { Condition } from './conditionTypes'
import { Fulfillment } from './fulfillmentTypes'
import { Decimal } from 'decimal.js'

export enum ReponseType {
  Block,
  Transaction,
  Wallet
}

export abstract class Response {
  abstract kind () : number;
}

export class Block extends Response {
  id: string;
  height: number;
  timestamp: number;
  transactions: Transaction[];
  minerFees?: MinerFee[];

  constructor (id: string, height: number, timestamp: number, transactions: Transaction[]) {
    super();
    this.id = id;
    this.height = height;
    this.timestamp = timestamp;
    this.transactions = transactions;
  }

  kind () : number {
    return ReponseType.Block
  }
}

export class Transaction extends Response {
  version: number;
  id?: string;

  // Optional block fields
  blockId?: string;
  blockHeight?: number;
  blockTime?: number;

  coinInputs?: Input[];
  coinOutputs?: Output[];
  blockstakeInputs?: Input[];
  blockstakeOutputs?: Output[];

  extensionProperties?: Map<string, string>;
  arbitraryData?: string;
  unconfirmed?: boolean;

  constructor (version: number) {
    super();
    this.version = version;
  }

  kind () : number {
    return ReponseType.Transaction
  }
}

export class Wallet extends Response {
  address: string;
  confirmedCoinBalance: Currency;
  confirmedBlockstakeBalance: number;
  transactions?: Transaction[]
  coinOutputs?: Output[];

  constructor (address: string, confirmedCoinBalance: Currency, confirmedBlockstakeBalance: number) {
    super();
    this.address = address;
    this.confirmedCoinBalance = confirmedCoinBalance;
    this.confirmedBlockstakeBalance = confirmedBlockstakeBalance;
  }

  kind () : number {
    return ReponseType.Wallet
  }
}

export interface Input {
  parentid: string;
  fulfillment: Fulfillment;
  parentOutput?: Output;
}

export interface Output {
  value: Currency;
  condition: Condition;
  id?: string;
}

export interface MinerFee {
  value: Currency;
  unlockhash: string;
}

export class Currency extends Decimal {
  tokenPrecision: number;

  constructor(n: string | number | Currency, tokenPrecision: number) {
    const value = new Decimal(n).dividedBy(tokenPrecision)
    super(value);
    this.tokenPrecision = tokenPrecision
  }
}