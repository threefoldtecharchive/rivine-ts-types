export abstract class Fulfillment {
  type: number;

  constructor (type: number) {
    this.type = type;
  }

  getFulfillmentType () : number {
    return this.type;
  }

  abstract getFulfillmentTypeAsString () : string
}

export class SingleSignatureFulfillment extends Fulfillment {
  publicKey: string;
  signature: string;

  constructor(type: number, publicKey: string, signature:string) {
    super(type);
    this.publicKey = publicKey;
    this.signature = signature;
  }

  getFulfillmentTypeAsString () : string {
    return "Single Signature Fulfillment"
  }
}

export class AtomicSwapFulfillment extends Fulfillment {
  publicKey: string;
  signature: string;
  secret?: string;

  constructor(type: number, publicKey: string, signature:string) {
    super(type);
    this.publicKey = publicKey;
    this.signature = signature;
  }

  getFulfillmentTypeAsString () : string {
    return "Atomic Swap Fulfillment"
  }
}

export class MultisignatureFulfillment extends Fulfillment {
  pairs: KeyPair[];

  constructor(type: number, pairs: KeyPair[]) {
    super(type);
    this.pairs = pairs;
  }

  getFulfillmentTypeAsString () : string {
    return "Multisignature Fulfillment"
  }
}

export interface KeyPair {
  publickey: string;
  signature: string;
}