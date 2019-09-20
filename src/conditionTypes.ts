export class Condition {
  type: number;

  constructor (type: number) {
    this.type = type;
  }

  getConditionType () {
    return this.type;
  }

  getConditionTypeAsString () {
    switch (this.type) {
      case 0:
        return "Base Condition"
      case 1:
        return "Unlockhash Condition"
      case 2:
        return "Atomic Swap Condition"
      case 3:
        return ""
      default:
        throw new Error("Uknown condition type")
    }
  }
}

export class UnlockhashCondition extends Condition {
  unlockhash: string;

  constructor (type: number, unlockhash: string) {
    super(type)
    this.unlockhash = unlockhash;
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
}

export class TimelockCondition extends Condition {
  locktime: number;
  condition: UnlockhashCondition|MultisignatureCondition;

  constructor (type: number, locktime: number, condition: UnlockhashCondition|MultisignatureCondition) {
    super(type);
    this.locktime = locktime;
    this.condition = condition;
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
}
