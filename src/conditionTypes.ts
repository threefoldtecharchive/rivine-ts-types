export abstract class Condition {
  public type: number;
  public id?: string;

  constructor (type: number) {
    this.type = type;
  }

  public getConditionType () : number {
    return this.type;
  }

  public abstract getConditionTypeAsString () : string;
}

export class NilCondition extends Condition {
  constructor (type: number) {
    super(type)
  }

  public getConditionTypeAsString () : string {
    return "Nil Condition"
  }
}

export class UnlockhashCondition extends Condition {
  public unlockhash: string;

  constructor (type: number, unlockhash: string) {
    super(type)
    this.unlockhash = unlockhash;
  }

  public getConditionTypeAsString () : string {
    return "Unlockhash Condition"
  }
}

export class AtomicSwapCondition extends Condition {
  public sender: string;
  public receiver: string;
  public hashedSecret: string;
  public timelock: number;

  constructor (type: number, sender: string, receiver: string, hashedsecret: string, timelock: number) {
    super(type);
    this.sender = sender;
    this.receiver = receiver;
    this.hashedSecret = hashedsecret;
    this.timelock = timelock;
  }

  public getConditionTypeAsString () : string {
    return "Atomic Swap Condition"
  }
}

export class TimelockCondition extends Condition {
  public locktime: number;
  public condition: UnlockhashCondition|MultisignatureCondition|NilCondition;

  constructor (type: number, locktime: number, condition: UnlockhashCondition|MultisignatureCondition|NilCondition) {
    super(type);
    this.locktime = locktime;
    this.condition = condition;
  }

  public getConditionTypeAsString () : string {
    return "Timelock Condition"
  }
}

export class MultisignatureCondition extends Condition {
  public unlockhashes: string[];
  public signatureCount: number;

  constructor (type: number, unlockhashes: string[], signatureCount: number) {
    super(type);
    this.unlockhashes = unlockhashes;
    this.signatureCount = signatureCount;
  }

  public getConditionTypeAsString () : string {
    return "Multisignature Condition"
  }
}
