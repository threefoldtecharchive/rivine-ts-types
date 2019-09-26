export enum ConditionType {
  NilCondition,
  UnlockhashCondition,
  AtomicSwapCondition,
  TimelockCondition,
  MultisignatureCondition
}

export abstract class Condition {
  public type: number
  public id?: string

  constructor (type: number) {
    this.type = type
  }

  public getConditionType (): number {
    return this.type
  }

  public abstract getConditionTypeAsString (): number
}

export class NilCondition extends Condition {
  constructor (type: number) {
    super(type)
  }

  public getConditionTypeAsString (): number {
    return ConditionType.NilCondition
  }
}

export class UnlockhashCondition extends Condition {
  public unlockhash: string

  constructor (type: number, unlockhash: string) {
    super(type)
    this.unlockhash = unlockhash
  }

  public getConditionTypeAsString (): number {
    return ConditionType.UnlockhashCondition
  }
}

export class AtomicSwapCondition extends Condition {
  public sender: string
  public receiver: string
  public contractAddress: string
  public hashedSecret: string
  public timelock: number

  constructor
  (type: number, sender: string, receiver: string, contractAddress: string, hashedsecret: string, timelock: number) {
    super(type)
    this.sender = sender
    this.receiver = receiver
    this.contractAddress = contractAddress
    this.hashedSecret = hashedsecret
    this.timelock = timelock
  }

  public getConditionTypeAsString (): number {
    return ConditionType.AtomicSwapCondition
  }
}

export class TimelockCondition extends Condition {
  public locktime: number
  public condition: UnlockhashCondition | MultisignatureCondition | NilCondition

  constructor
  (type: number, locktime: number, condition: UnlockhashCondition | MultisignatureCondition | NilCondition) {
    super(type)
    this.locktime = locktime
    this.condition = condition
  }

  public getConditionTypeAsString (): number {
    return ConditionType.TimelockCondition
  }
}

export class MultisignatureCondition extends Condition {
  public unlockhashes: string[]
  public signatureCount: number

  constructor (type: number, unlockhashes: string[], signatureCount: number) {
    super(type)
    this.unlockhashes = unlockhashes
    this.signatureCount = signatureCount
  }

  public getConditionTypeAsString (): number {
    return ConditionType.MultisignatureCondition
  }
}
