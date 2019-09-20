import { Condition } from './conditionTypes'
import { Fulfillment } from './fulfillmentTypes'

export class Block {
  id: string;
  height: number;
  transactions: Transaction[];
  blockstakeInputs?: Input[];
  blockstakeOutputs?: Output[];
  coinInputs?: Input[];
  coinOutputs?: Output[];

  constructor (id: string, height: number, transactions: Transaction[]) {
    this.id = id;
    this.height = height;
    this.transactions = transactions;
  }
}

export class Transaction {
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

  extensionProperties?: Object[];
  arbitraryData?: string;
  confirmed?: boolean;

  constructor (version: number) {
    this.version = version;
  }
}

export class Wallet {
  address: string;
  confirmedCoinBalance: number;
  blockstakeBalance: number;
  transactions?: Transaction[]
  coinOutputs?: Output[];

  constructor (address: string, confirmedCoinBalance: number, blockstakeBalance: number) {
    this.address = address;
    this.confirmedCoinBalance = confirmedCoinBalance;
    this.blockstakeBalance = blockstakeBalance;
  }
}

export interface Input {
  parentid: string;
  fulfillment: Fulfillment;
  parentOutput?: Output;
}

export interface Output {
  value: number;
  condition: Condition;
  id?: string;
}