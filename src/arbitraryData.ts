export abstract class ArbitraryData {
  public value: string;

  constructor (value: string) {
    this.value = value;
  }
}

export class OpaqueArbitraryData extends ArbitraryData {
  constructor (value: string) {
    super(value);
  }
}

export class StructuredArbitraryData extends ArbitraryData {
  constructor (value: string) {
    super(value);
  }
}

export class SenderMessageData extends ArbitraryData {
  constructor (value: string) {
    super(value);
  }
}