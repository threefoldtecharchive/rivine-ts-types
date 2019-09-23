import { Input, Output, Block, Transaction, Wallet, MinerFee, Currency } from './types';
import { Condition, UnlockhashCondition, AtomicSwapCondition, MultisignatureCondition, TimelockCondition, NilCondition } from './conditionTypes';
import { Fulfillment, SingleSignatureFulfillment, AtomicSwapFulfillment, MultisignatureFulfillment, KeyPair } from './fulfillmentTypes';

export class Parser {
  precision: number = 9;

  constructor (precision?: number) {
    // If a precision is provided, use this one
    if (precision) {
      this.precision = precision
    }

    // Set precision
    this.precision = Math.pow(10, this.precision);
  }

  ParseJSONResponse (res: any): Transaction|Block|Wallet|{} {
    if (res.hashtype === 'blockid' || res.block) {
      return this.ParseBlock(res.block);
    }
    return {}
  }

  ParseBlock (block:any) : Block {
    const { blockid:id, height, transactions, rawblock } = block;
    const { timestamp, minerpayouts } = rawblock;
    const parsedTransactions = this.ParseTransactions(transactions, id, height);
    const parsedBlock = new Block(id, height, timestamp, parsedTransactions);

    if (minerpayouts.length > 0) {
      parsedBlock.minerFees = minerpayouts.map((mp:MinerFee) => {
        return {
          value: new Currency(mp.value, this.precision),
          unlockhash: mp.unlockhash
        }
      })
    }
    return parsedBlock
  }

  // ParseTransactions parses transactions return from API to out typed transactions
  ParseTransactions (transactions: any, blockId?: string, blockHeight?: number, blockTime?: number) : Transaction[]|[] {
    return transactions.map((tx: any) => {
      const { rawtransaction, id, unconfirmed } = tx;
      const { version } = tx.rawtransaction;

      // Create the Transaction
      let transaction = new Transaction(version);

      // Set blockConstants
      transaction.blockId = blockId;
      transaction.blockHeight = blockHeight;
      transaction.blockTime = blockTime;

      transaction.id = id;
      transaction.unconfirmed = unconfirmed;

      const bsOutputs = rawtransaction.data.blockstakeoutputs || [];
      const bsOutputIds = tx.blockstakeoutputids || [];
      const bsInputs = rawtransaction.data.blockstakeinputs || [];

      const coinOutputs = rawtransaction.data.coinoutputs || [];
      const coinOutputIds = tx.coinoutputids || [];
      const coinInputs = rawtransaction.data.coininputs || [];

      transaction.blockstakeInputs = this.getInputs(bsInputs);
      transaction.blockstakeOutputs = this.getOutputs(bsOutputs, bsOutputIds);

      transaction.coinInputs = this.getInputs(coinInputs);
      transaction.coinOutputs = this.getOutputs(coinOutputs, coinOutputIds);

      // todo add arbitrary data and extension props

      return transaction
    })
  }

  getOutputs(outputs: any, outputIds: any): Output[] {
    return outputs.map((output: Output, index: number) => {
      return {
        id: outputIds[index],
        value: new Currency(output.value, this.precision),
        condition: this.getCondition(output)
      };
    });
  }

  getInputs(inputs: any): Input[] {
    return inputs.map((input: Input) => {
      return {
        parentid: input.parentid,
        fulfillment: this.getFulfillment(input)
      };
    });
  }

  getCondition (output: any) : Condition {
    const { data } = output.condition
    switch (output.condition.type) {
      case 1:
        // TODO set value
        return new UnlockhashCondition(1, output.condition.data.unlockhash);
      case 2:
        const { sender, receiver, hashedSecret, timelock } = data
        return new AtomicSwapCondition(2, sender, receiver, hashedSecret, timelock)
      case 3:
        let condition: MultisignatureCondition|UnlockhashCondition|NilCondition;
        if (data.unlockhashes) {
          condition = new MultisignatureCondition(4, data.unlockhashes, data.minimumsignaturecount);
        } else if (data.unlockhash) {
          condition = new UnlockhashCondition(1, output.condition.data.unlockhash);
        } else {
          return new UnlockhashCondition(1, output.unlockhash);
        }
        return new TimelockCondition(3, data.locktime, condition)
      case 4:
        return new MultisignatureCondition(4, data.unlockhashes, data.minimumsignaturecount)
      default:
        throw new Error("Condition is not recongnised on data")
    }
  }

  getFulfillment (input: any) : Fulfillment {
    const { data } = input.fulfillment
    switch (input.fulfillment.type) {
      case 1:
        return new SingleSignatureFulfillment(1, data.publickey, data.signature);
      case 2:
        let atomicSwapFulfillment: AtomicSwapFulfillment = new AtomicSwapFulfillment(1, data.publickey, data.signature);
        if (data.secret) {
          atomicSwapFulfillment.secret = data.secret
        }
        return atomicSwapFulfillment
      case 3:
        const { pairs } = data
        const keypairs = pairs.map((p:KeyPair) => {
          return {
            publickey: p.publickey,
            signature: p.signature
          }
        })
        return new MultisignatureFulfillment(3, keypairs)
      default:
        throw new Error("Fulfillment is not recongnised on data")
    }
  }
  
}