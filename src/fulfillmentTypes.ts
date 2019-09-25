export abstract class Fulfillment {
  public type: number

  constructor (type: number) {
    this.type = type
  }

  public getFulfillmentType (): number {
    return this.type
  }

  public abstract getFulfillmentTypeAsString (): string
}

export class SingleSignatureFulfillment extends Fulfillment {
  public publicKey: string
  public signature: string

  constructor (type: number, publicKey: string, signature: string) {
    super(type)
    this.publicKey = publicKey
    this.signature = signature
  }

  public getFulfillmentTypeAsString (): string {
    return 'Single Signature Fulfillment'
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

  public getFulfillmentTypeAsString (): string {
    return 'Atomic Swap Fulfillment'
  }
}

export class MultisignatureFulfillment extends Fulfillment {
  public pairs: KeyPair[]

  constructor (type: number, pairs: KeyPair[]) {
    super(type)
    this.pairs = pairs
  }

  public getFulfillmentTypeAsString (): string {
    return 'Multisignature Fulfillment'
  }
}

export interface KeyPair {
  publickey: string
  signature: string
}
