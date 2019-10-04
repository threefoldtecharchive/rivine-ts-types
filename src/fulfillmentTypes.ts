export enum FulfillmentType {
  SingleSignatureFulfillment,
  AtomicSwapFulfillment,
  MultisignatureFulfillment
}

export abstract class Fulfillment {
  public type: number

  constructor (type: number) {
    this.type = type
  }

  public kind (): number {
    return this.type
  }

  public abstract getFulfillmentType (): FulfillmentType
}

export class SingleSignatureFulfillment extends Fulfillment {
  public publicKey: string
  public signature: string

  constructor (type: number, publicKey: string, signature: string) {
    super(type)
    this.publicKey = publicKey
    this.signature = signature
  }

  public getFulfillmentType (): FulfillmentType {
    return FulfillmentType.SingleSignatureFulfillment
  }
}

export class AtomicSwapFulfillment extends Fulfillment {
  public publicKey: string
  public signature: string
  public secret?: string

  constructor (type: number, publicKey: string, signature: string) {
    super(type)
    this.publicKey = publicKey
    this.signature = signature
  }

  public getFulfillmentType (): FulfillmentType {
    return FulfillmentType.AtomicSwapFulfillment
  }
}

export class MultisignatureFulfillment extends Fulfillment {
  public pairs: KeyPair[]

  constructor (type: number, pairs: KeyPair[]) {
    super(type)
    this.pairs = pairs
  }

  public getFulfillmentType (): FulfillmentType {
    return FulfillmentType.MultisignatureFulfillment
  }
}

export interface KeyPair {
  publickey: string
  signature: string
}
