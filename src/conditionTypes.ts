export abstract class Condition {
  type: number;
  id?: string;

  constructor (type: number) {
    this.type = type;
  }

  getConditionType () : number {
    return this.type;
  }

  abstract getConditionTypeAsString () : string;
}

export class NilCondition extends Condition {
  constructor (type: number) {
    super(type)
  }

  getConditionTypeAsString () : string {
    return "Nil Condition"
  }
}

export class UnlockhashCondition extends Condition {
  unlockhash: string;

  constructor (type: number, unlockhash: string) {
    super(type)
    this.unlockhash = unlockhash;
  }

  getConditionTypeAsString () : string {
    return "Unlockhash Condition"
  }
}

export class AtomicSwapCondition extends Condition {
  sender: string;
  receiver: string;
  hashedSecret: string;
  timelock: number;

  constructor (type: number, sender: string, receiver: string, hashedsecret: string, timelock: number) {
    super(type);
    this.sender = sender;
    this.receiver = receiver;
    this.hashedSecret = hashedsecret;
    this.timelock = timelock;
  }

  getConditionTypeAsString () : string {
    return "Atomic Swap Condition"
  }
}

export class TimelockCondition extends Condition {
  locktime: number;
  condition: UnlockhashCondition|MultisignatureCondition|NilCondition;

  constructor (type: number, locktime: number, condition: UnlockhashCondition|MultisignatureCondition|NilCondition) {
    super(type);
    this.locktime = locktime;
    this.condition = condition;
  }

  getConditionTypeAsString () : string {
    return "Timelock Condition"
  }
}

export class MultisignatureCondition extends Condition {
  unlockhashes: string[];
  signatureCount: number;

  constructor (type: number, unlockhashes: string[], signatureCount: number) {
    super(type);
    this.unlockhashes = unlockhashes;
    this.signatureCount = signatureCount;
  }

  getConditionTypeAsString () : string {
    return "Multisignature Condition"
  }
}
