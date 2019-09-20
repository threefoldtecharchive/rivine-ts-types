import { Input, Output, Block, Transaction } from './types';
import { Condition, UnlockhashCondition, AtomicSwapCondition, MultisignatureCondition, TimelockCondition } from './conditionTypes';
import { Fulfillment, SingleSignatureFulfillment, AtomicSwapFulfillment, MultisignatureFulfillment, KeyPair } from './fulfillmentTypes';

export function ParseBlock (block:any) : Block {
  const { blockid:id, height, transactions } = block;
  const parsedTransactions = ParseTransactions(transactions, id, height);
  return new Block(id, height, parsedTransactions);
}

// ParseTransactions parses transactions return from API to out typed transactions
export function ParseTransactions (transactions: any, blockId?: string, blockHeight?: number, blockTime?: number) : Transaction[]|[] {
  return transactions.map((tx: any) => {
    const { rawtransaction, id, confirmed } = tx;
    const { version } = tx.rawtransaction;

    // Create the Transaction
    let transaction = new Transaction(version);

    transaction.id = id;
    transaction.confirmed = confirmed;

    const bsOutputs = rawtransaction.data.blockstakeoutputs || [];
    const bsOutputIds = tx.blockstakeoutputids || [];
    const bsInputs = rawtransaction.data.blockstakeinputs || [];

    const coinOutputs = rawtransaction.data.coinoutputs || [];
    const coinOutputIds = tx.coinoutputids || [];
    const coinInputs = rawtransaction.data.coininputs || [];

    transaction.blockstakeInputs = getInputs(bsInputs);
    transaction.blockstakeOutputs = getOutputs(bsOutputs, bsOutputIds);

    transaction.coinInputs = getInputs(coinInputs);
    transaction.coinOutputs = getOutputs(coinOutputs, coinOutputIds);

    // todo add arbitrary data and extension props

    return transaction
  })
}

function getOutputs(outputs: any, outputIds: any): Output[] {
  return outputs.map((output: any, index: any) => {
    return {
      id: outputIds[index],
      value: output.value,
      condition: getCondition(output)
    };
  });
}

function getInputs(inputs: any): Input[] {
  return inputs.map((input: any) => {
    return {
      parentid: input.parentid,
      fulfillment: getFulfillment(input)
    };
  });
}


function getCondition (output: any) : Condition {
  const { data } = output.condition
  switch (output.condition.type) {
    case 1:
      // TODO set value
      return new UnlockhashCondition(1, output.condition.data.unlockhash);
    case 2:
      const { sender, receiver, hashedSecret, timelock } = data
      return new AtomicSwapCondition(2, sender, receiver, hashedSecret, timelock)
    case 3:
      let condition: MultisignatureCondition|UnlockhashCondition;
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

function getFulfillment (input: any) : Fulfillment {
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
      const keypairs = pairs.map((p:any) => {
        const keypair: KeyPair = {
          publickey: p.publickey,
          signature: p.signature
        }
        return keypair
      })
      return new MultisignatureFulfillment(3, keypairs)
    default:
      throw new Error("Fulfillment is not recongnised on data")
  }
}
