export class Fulfillment {
  type: number;

  constructor (type: number) {
    this.type = type;
  }

  getFulfillmentType () {
    return this.type;
  }

  getFulfillmentTypeAsString () {
    switch (this.type) {
      case 1:
        return "Single Signature Fulfillment"
      case 2:
        return "Atomic Swap Fulfillment"
      case 3:
        return "Multisignature Fulfillment"
      default:
        throw new Error("Uknown fulfillment type")
    }
  }
}

export class SingleSignatureFulfillment extends Fulfillment {
  publicKey: string;
  signature: string;

  constructor(type: number, publicKey: string, signature:string) {
    super(type);
    this.publicKey = publicKey;
    this.signature = signature;
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
}

export class MultisignatureFulfillment extends Fulfillment {
  pairs: KeyPair[];

  constructor(type: number, pairs: KeyPair[]) {
    super(type);
    this.pairs = pairs;
  }
}

export interface KeyPair {
  publickey: string;
  signature: string;
}