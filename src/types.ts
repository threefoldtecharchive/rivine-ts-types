import { Condition } from './conditionTypes'
import { Fulfillment } from './fulfillmentTypes'
import { Decimal } from 'decimal.js'

export enum ResponseType {
  Block,
  Transaction,
  Wallet,
  CoinOutputInfo,
  BlockstakeOutputInfo
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
    return ResponseType.Block;
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
    return ResponseType.Transaction;
  }
}

export class Wallet extends Response {
  address: string;

  // this identifier can tell us if the Wallet belong to a blockcreator
  isBlockCreator: boolean;

  confirmedCoinBalance: Currency;
  lastCoinSpent?: LastSpent;
  confirmedBlockstakeBalance: Currency;
  lastBlockStakeSpent?: LastSpent;

  transactions?: Transaction[]
  coinOutputs?: Output[];
  minerPayouts?: Output[];
  coinOutputsBlockCreator?: Output[];
  blockStakesOutputsBlockCreator?: Output[];

  constructor (address: string, confirmedCoinBalance: Currency, confirmedBlockstakeBalance: Currency) {
    super();
    this.address = address;
    this.confirmedCoinBalance = confirmedCoinBalance;
    this.confirmedBlockstakeBalance = confirmedBlockstakeBalance;

    // Set default to false
    this.isBlockCreator = false;
  }

  kind () : number {
    return ResponseType.Wallet;
  }
}

export class CoinOutputInfo extends Response {
  output: Output;
  creationTx: Transaction;
  spentTx?: Transaction;

  constructor (output: Output, creationTx: Transaction) {
    super();
    this.output = output;
    this.creationTx = creationTx;
  }

  kind () : number {
    return ResponseType.CoinOutputInfo;
  }
}

export class BlockstakeOutputInfo extends Response {
  output: Output;
  creationTx: Transaction;
  spentTx?: Transaction;

  constructor (output: Output, creationTx: Transaction) {
    super();
    this.output = output;
    this.creationTx = creationTx;
  }

  kind () : number {
    return ResponseType.BlockstakeOutputInfo;
  }
}

export interface Input {
  parentid: string;
  fulfillment: Fulfillment;
  parentOutput?: Output;
}

export interface Output {
  value: Currency;
  condition?: Condition;
  id?: string;
  spent?: boolean;
}

export interface MinerFee {
  value: Currency;
  unlockhash: string;
}

export interface LastSpent {
  txid: string;
  height: number;
}

export class Currency extends Decimal {
  tokenPrecision: number;

  constructor(n: string | number | Currency, tokenPrecision: number) {
    const value = new Decimal(n).dividedBy(tokenPrecision);
    super(value);
    this.tokenPrecision = tokenPrecision;
  }
}