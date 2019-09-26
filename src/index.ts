import Decimal from 'decimal.js'
import { find, flatten } from 'lodash'
import {
  AtomicSwapCondition, Condition, MultisignatureCondition, NilCondition, TimelockCondition, UnlockhashCondition
} from './conditionTypes'
import { AtomicSwapFulfillment, Fulfillment, KeyPair, MultisignatureFulfillment, SingleSignatureFulfillment } from './fulfillmentTypes'
import {
  Block, BlockstakeOutputInfo, CoinOutputInfo, Currency, Input, LastSpent, MinerFee, Output, Transaction, Wallet
} from './types'

const nullId = '0000000000000000000000000000000000000000000000000000000000000000'

export class Parser {
  public precision: number = 9
  private hash: string

  constructor (precision?: number) {
    // If a precision is provided, use this one
    if (precision) {
      this.precision = precision
    }

    // Set precision
    this.precision = Math.pow(10, this.precision)

    this.hash = ''
  }

  // Returns any because when we return a union type we can't set default values for them.
  public ParseHashResponseJSON (res: any, hash: string): any {
    // Save hash in state
    this.hash = hash

    if (res.hashtype === 'unlockhash') {
      return this.parseWalletAddress(res)
    }
    if (res.hashtype === 'coinoutputid') {
      return this.parseCoinOutput(res)
    }
    if (res.hashtype === 'blockstakeoutputid') {
      return this.parseBlockStakeOutput(res)
    }
    if (res.block && res.block.blockid !== nullId) {
      return this.parseBlock(res.block)
    }
    if (res.transaction && res.transaction.id !== nullId) {
      return this.parseTransaction(res.transaction)
    }
  }

  public ParseBlockResponseJSON (res: any): Block {
    return this.parseBlock(res.block)
  }

  private parseWalletAddress (res: any): Wallet {
    const transactions = res.transactions
    const blocks = res.blocks

    // If blocks field is populated then the address is probably the address of a blockcreator
    if (blocks) { return this.parseWalletForBlockCreator(blocks, transactions) }

    const { spentCoinOutputs, unspentCoinOutputs, availableBalance }
      = this.findCoinOutputOutputAppearances(this.hash, transactions)
    const { availableBlockstakeBalance } = this.findBlockStakeOutputOutputAppearances(this.hash, transactions)

    const availableWalletCoinBalance = new Currency(availableBalance, this.precision)
    const availableWalletBlockStakeBalance = new Currency(availableBlockstakeBalance, this.precision)

    const wallet = new Wallet(this.hash, availableWalletCoinBalance, availableWalletBlockStakeBalance)

    // Set Transaction on wallet object
    wallet.transactions = res.transactions.map((tx: any) => this.parseTransaction(tx))

    // Set unspent coinoutputs on wallet object
    wallet.coinOutputs = this.parseCoinOutputsWallet(unspentCoinOutputs, false)
    // Set spent coinoutputs on wallet object
    wallet.coinOutputs = wallet.coinOutputs.concat(this.parseCoinOutputsWallet(spentCoinOutputs, true))

    return wallet
  }

  private parseWalletForBlockCreator (blocks: any, transactions: any): Wallet {
    const { spentMinerPayouts, unspentMinerPayouts, availableBalance: availableMinerfeeBalance }
      = this.findMinerPayoutAppearances(this.hash, transactions, blocks)
    const { spentCoinOutputs, unspentCoinOutputs,lastCoinSpent, availableBalance: availableCoinBalance }
      = this.findCoinOutputOutputAppearances(this.hash, transactions)
    const {
      availableBlockstakeBalance, unspentBlockStakesOutputsBlockCreator,
      lastBsSpent, spentBlockStakesOutputsBlockCreator
    }
      = this.findBlockStakeOutputOutputAppearances(this.hash, transactions)

    // Calculate total balance
    const totalAvailableBalance = availableMinerfeeBalance.plus(availableCoinBalance)
    const availableWalletCoinBalance = new Currency(totalAvailableBalance, this.precision)

    const availableWalletBlockStakeBalance = new Currency(availableBlockstakeBalance, 1)

    const wallet = new Wallet(this.hash, availableWalletCoinBalance, availableWalletBlockStakeBalance)

    // Set unspent minerpayouts
    wallet.minerPayouts = this.parseMinerPayoutsWallet(unspentMinerPayouts, false)
    // Set spent minerpayouts
    wallet.minerPayouts.concat(this.parseMinerPayoutsWallet(spentMinerPayouts, true))

    // Set last coin spent
    wallet.lastCoinSpent = lastCoinSpent
    // Set last blockstake spent
    wallet.lastBlockStakeSpent = lastBsSpent

    // Set spent coin outputs for block creator
    wallet.coinOutputsBlockCreator = this.parseCoinOutputsWallet(spentCoinOutputs, true)
    wallet.coinOutputsBlockCreator = this.parseCoinOutputsWallet(unspentCoinOutputs, false)

    // Set unspent blockstake outputs for block creator
    wallet.blockStakesOutputsBlockCreator
      = this.parseBlockstakeOutputsWallet(unspentBlockStakesOutputsBlockCreator, false)
    wallet.blockStakesOutputsBlockCreator
      = wallet.blockStakesOutputsBlockCreator
        .concat(this.parseBlockstakeOutputsWallet(spentBlockStakesOutputsBlockCreator, true))

    // Identifier that will tell that this is a blockcreator wallet
    wallet.isBlockCreator = true

    return wallet
  }

  // findCoinOutputOutputAppearances finds the spent / unspent miner payouts for an address
  private findMinerPayoutAppearances (address: string, transactions: any, blocks: any): any {
    const spentMinerPayouts: any = []

    const unspentMinerPayouts = flatten(
      blocks.map((block: any) => {
        return block.rawblock.minerpayouts.map((mp: any, index: number) => {
          if (mp.unlockhash === address) {
            const minerPayout = block.rawblock.minerpayouts[index]
            if (minerPayout) {
              return {
                ...minerPayout,
                minerPayoutId: block.minerpayoutids[index],
                blockid: block.blockid,
                blockHeight: block.height
              }
            }
          }
        })
      })
    ).filter(Boolean) as any

    transactions.forEach((tx: any) => {
      if (!tx.rawtransaction.data.coininputs) { return }
      tx.rawtransaction.data.coininputs.forEach(
        (ci: any) => {
          const existsInUcosIndex: number = unspentMinerPayouts.findIndex(
            (uco: any) => uco.minerPayoutId === ci.parentid
          )
          if (existsInUcosIndex > -1) {
            spentMinerPayouts.push(unspentMinerPayouts[existsInUcosIndex])
            unspentMinerPayouts.splice(existsInUcosIndex, 1)
          }
        }
      )
    })

    let availableBalance: Decimal = new Decimal(0)
    unspentMinerPayouts.map((uco: any) => {
      availableBalance = availableBalance.plus(uco.value)
    })

    return { spentMinerPayouts, unspentMinerPayouts, availableBalance }
  }

  // findCoinOutputOutputAppearances finds the spent / unspent coin outputs for an address
  private findCoinOutputOutputAppearances (address: string, transactions: any): any {
    const spentCoinOutputs: any = []

    const unspentCoinOutputs = transactions
      .map((tx: any) => {
        if (!tx.coinoutputunlockhashes) { return }
        const ucoIndex = tx.coinoutputunlockhashes.findIndex(
          (uh: any) => uh === address
        )
        const coinOutput = tx.rawtransaction.data.coinoutputs[ucoIndex]
        if (coinOutput) {
          return {
            ...coinOutput,
            coinOutputId: tx.coinoutputids[ucoIndex]
          }
        }
      })
      .filter(Boolean)

    let lastCoinSpent: LastSpent = {
      height: 0,
      txid: ''
    }

    transactions.forEach((tx: any) => {
      if (!tx.rawtransaction.data.coininputs) { return }
      tx.rawtransaction.data.coininputs.forEach((ci: any) => {
        const existsInUcosIndex: number = unspentCoinOutputs.findIndex(
          (uco: any) => uco.coinOutputId === ci.parentid
        )
        if (existsInUcosIndex > -1) {
          // Save last coin spent
          if (lastCoinSpent && lastCoinSpent.height) {
            if (tx.height > lastCoinSpent.height) {
              lastCoinSpent = {
                height: tx.height,
                txid: tx.id
              }
            }
            // if it doesn't exist, initialize it
          } else {
            lastCoinSpent = {
              height: tx.height,
              txid: tx.id
            }
          }

          spentCoinOutputs.push(unspentCoinOutputs[existsInUcosIndex])
          unspentCoinOutputs.splice(existsInUcosIndex, 1)
        }
      })
    })
    let availableBalance: Decimal = new Decimal(0)
    unspentCoinOutputs.map((uco: any) => {
      availableBalance = availableBalance.plus(uco.value)
    })

    return { spentCoinOutputs, unspentCoinOutputs, lastCoinSpent, availableBalance }
  }

  // findBlockStakeOutputOutputAppearances finds the spent / unspent blockstake outputs for an address
  private findBlockStakeOutputOutputAppearances (address: string, transactions: any): any {
    const spentBlockStakesOutputsBlockCreator: any = []

    const ucos = transactions
      .map((tx: any) => {
        if (!tx.blockstakeunlockhashes) { return }
        const buIndex = tx.blockstakeunlockhashes.findIndex(
          (uh: any) => uh === address
        )
        const blockstakeOutput =
          tx.rawtransaction.data.blockstakeoutputs[buIndex]
        if (blockstakeOutput) {
          return {
            ...blockstakeOutput,
            blockstakeOutputId: tx.blockstakeoutputids[buIndex],
            blockHeight: tx.height,
            txid: tx.id
          }
        }
      })
      .filter(Boolean)

    let lastBsSpent: LastSpent = {
      height: 0,
      txid: ''
    }

    transactions.forEach((tx: any) => {
      if (!tx.rawtransaction.data.blockstakeinputs) { return }
      const spentUcos = tx.rawtransaction.data.blockstakeinputs.map(
        (ci: any) => {
          const existsInBusIndex: number = ucos.findIndex(
            (uco: any) => uco.blockstakeOutputId === ci.parentid
          )
          if (existsInBusIndex > -1) {
            // Save last bs spent
            if (lastBsSpent && lastBsSpent.height) {
              if (tx.height > lastBsSpent.height) {
                lastBsSpent = {
                  height: tx.height,
                  txid: tx.id
                }
              }
              // if it doesn't exist, initialize it
            } else {
              lastBsSpent = {
                height: tx.height,
                txid: tx.id
              }
            }

            spentBlockStakesOutputsBlockCreator.push(ucos[existsInBusIndex])
            ucos.splice(existsInBusIndex, 1)
          }
        }
      )
    })

    let availableBlockstakeBalance: Decimal = new Decimal(0)
    ucos.map((uco: any) => {
      availableBlockstakeBalance = availableBlockstakeBalance.plus(uco.value)
    })

    const unspentBlockStakesOutputsBlockCreator = ucos

    return { availableBlockstakeBalance, unspentBlockStakesOutputsBlockCreator,
      lastBsSpent, spentBlockStakesOutputsBlockCreator }
  }

  private parseBlock (block: any): Block {
    const { blockid: id, height, transactions, rawblock, minerpayoutids } = block
    const { timestamp, minerpayouts } = rawblock

    const parsedTransactions = transactions.map((tx: any) => this.parseTransaction(tx, id, height, timestamp))
    const parsedBlock = new Block(id, height, timestamp, parsedTransactions)

    if (minerpayouts.length > 0) {
      parsedBlock.minerFees = minerpayouts.map((mp: MinerFee, index: number) => {
        return {
          value: new Currency(mp.value, this.precision),
          unlockhash: mp.unlockhash,
          id: minerpayoutids[index]
        }
      })
    }
    return parsedBlock
  }

  private parseTransaction (tx: any, blockId?: string, blockHeight?: number, blockTime?: number): Transaction {
    const { rawtransaction, id, unconfirmed } = tx
    const { version } = tx.rawtransaction

    // Create the Transaction
    const transaction = new Transaction(version)

    // Set blockConstants
    transaction.blockId = blockId
    transaction.blockHeight = blockHeight
    transaction.blockTime = blockTime

    transaction.id = id
    transaction.unconfirmed = unconfirmed

    const bsOutputs = rawtransaction.data.blockstakeoutputs || []
    const bsOutputIds = tx.blockstakeoutputids || []
    const bsInputs = rawtransaction.data.blockstakeinputs || []

    const coinOutputs = rawtransaction.data.coinoutputs || []
    const coinOutputIds = tx.coinoutputids || []
    const coinInputs = rawtransaction.data.coininputs || []

    transaction.blockstakeInputs = this.getInputs(bsInputs)
    transaction.blockstakeOutputs = this.getBlockstakeOutputs(bsOutputs, bsOutputIds)

    transaction.coinInputs = this.getInputs(coinInputs)
    transaction.coinOutputs = this.getOutputs(coinOutputs, coinOutputIds)

    // todo add arbitrary data and extension props

    return transaction
  }

  // parseCoinOutput gets coinoutput information for a normal coin outputs and also for blockcreator coin outputs
  private parseCoinOutput (res: any): CoinOutputInfo | undefined {
    const { blocks, transactions } = res
    let parsedTransactions: Transaction[] = []
    let parsedBlocks: Block[] = []

    if (transactions) {
      parsedTransactions = transactions.map((tx: Transaction) => this.parseTransaction(tx))
    }

    if (blocks) {
      parsedBlocks = blocks.map((block: Block) => this.parseBlock(block)) as Block[]
    }

    let coinOutput: any
    let coinInput: any

    parsedTransactions.forEach((tx: Transaction) => {
      const { coinOutputs, coinInputs } = tx

      // If coinoutputs are defined, start looking for the coinoutput that matches our hash
      if (coinOutputs) {
        // Only try finding output when there is none present, else it will override with undefined
        if (!coinOutput) {
          coinOutput = find(coinOutputs, (co: Output) => co.id === this.hash) as Output
          // If found set txid
          if (coinOutput) {
            coinOutput.txId = tx.id
          }
        }
      }

      // If coininputs are defined, start looking for the coininput that matches our hash
      if (coinInputs) {
        // If a coininput with parent id equal to the hash we are looking for is found that the output is spent
        if (!coinInput) {
          coinInput = find(coinInputs, (co: Input) => co.parentid === this.hash) as Input
          // If found set txid
          if (coinInput) {
            coinInput.txId = tx.id
          }
        }
      }
    })

    // If no coin ouput is found then it is most likely a blockcreator output.
    // we now look inside the minerfees if we can find this output
    if (!coinOutput) {
      parsedBlocks.forEach((block: Block) => {
        const minerFee = find(block.minerFees, (mf: MinerFee) => mf.id === this.hash) as MinerFee
        if (minerFee) {
          coinOutput = {
            id: minerFee.id,
            value: minerFee.value,
            blockId: block.id,
            isBlockCreatorReward: true
          } as Output
        }
      })
    }

    // Wrap found coinout / coininput and return
    const coinOutputInfo = new CoinOutputInfo(coinOutput)
    if (coinInput) {
      coinOutputInfo.input = coinInput
    }
    return coinOutputInfo
  }

  private parseBlockStakeOutput (res: any): BlockstakeOutputInfo | undefined {
    const { transactions } = res

    const hash = this.hash

    const parsedTransactions = transactions.map((tx: Transaction) => this.parseTransaction(tx))

    let blockStakeOutput: any
    let blockStakeInput: any

    parsedTransactions.forEach((tx: Transaction) => {
      const { blockstakeOutputs, blockstakeInputs } = tx

      // If blockStakeOutputs are defined, start looking for the blockStakeOutput that matches our hash
      if (blockstakeOutputs) {
        // Only try finding output when there is none present, else it will override with undefined
        if (!blockStakeOutput) {
          blockStakeOutput = find(blockstakeOutputs, (co: Output) => co.id === this.hash) as Output
          // If found set txid
          if (blockStakeOutput) {
            blockStakeOutput.txId = tx.id
          }
        }
      }

      // If blockStakeInputs are defined, start looking for the blockStakeInput that matches our hash
      if (blockstakeInputs) {
        // If a blockStakeInput with parent id equal to the hash we are looking for is found that the output is spent
        if (!blockStakeInput) {
          blockStakeInput = find(blockstakeInputs, (co: Input) => co.parentid === this.hash) as Input
          // If found set txid
          if (blockStakeInput) {
            blockStakeInput.txId = tx.id
          }
        }
      }
    })

    // Wrap found blockStakeOutput / blockStakeInput and return
    const blockStakeOutputInfo = new BlockstakeOutputInfo(blockStakeOutput)
    if (blockStakeInput) {
      blockStakeOutputInfo.input = blockStakeInput
    }
    return blockStakeOutputInfo
  }

  private getOutputs (outputs: any, outputIds: any): Output[] {
    return outputs.map((output: Output, index: number) => {
      return {
        id: outputIds[index],
        value: new Currency(output.value, this.precision),
        condition: this.getCondition(output)
      }
    })
  }

  private parseCoinOutputsWallet (outputs: any, spent: boolean): Output[] {
    return outputs.map((output: any) => {
      return {
        id: output.coinOutputId,
        value: new Currency(output.value, this.precision),
        spent
      }
    })
  }

  private parseMinerPayoutsWallet (minerpayouts: any, spent: boolean): Output[] {
    return minerpayouts.map((mp: any) => {
      return {
        id: mp.minerPayoutId,
        value: new Currency(mp.value, this.precision),
        spent
      }
    })
  }

  private getBlockstakeOutputs (outputs: any, outputIds: any): Output[] {
    return outputs.map((output: Output, index: number) => {
      return {
        id: outputIds[index],
        value: new Currency(output.value, 1),
        condition: this.getCondition(output)
      }
    })
  }

  private parseBlockstakeOutputsWallet (outputs: any, spent: boolean): Output[] {
    return outputs.map((output: any, index: number) => {
      return {
        id: output.blockstakeOutputId,
        value: new Currency(output.value, 1),
        spent
      }
    })
  }

  private getInputs (inputs: any): Input[] {
    return inputs.map((input: Input) => {
      return {
        parentid: input.parentid,
        fulfillment: this.getFulfillment(input)
      }
    })
  }

  private getCondition (output: any): Condition {
    // If no condition object is present on the output we assume its a legacy condition
    // Legacy conditions are always single signature unlockhash conditions.
    if (!output.condition) {
      return new UnlockhashCondition(1, output.unlockhash)
    }

    const { data } = output.condition
    switch (output.condition.type) {
      case 1:
        // TODO set value
        return new UnlockhashCondition(1, output.condition.data.unlockhash)
      case 2:
        const { sender, receiver, hashedSecret, timelock } = data
        return new AtomicSwapCondition(2, sender, receiver, hashedSecret, timelock)
      case 3:
        let condition: MultisignatureCondition | UnlockhashCondition | NilCondition
        if (data.unlockhashes) {
          condition = new MultisignatureCondition(4, data.unlockhashes, data.minimumsignaturecount)
        } else if (data.unlockhash) {
          condition = new UnlockhashCondition(1, output.condition.data.unlockhash)
        } else {
          return new UnlockhashCondition(1, output.unlockhash)
        }
        return new TimelockCondition(3, data.locktime, condition)
      case 4:
        return new MultisignatureCondition(4, data.unlockhashes, data.minimumsignaturecount)
      default:
        throw new Error('Condition is not recongnised on data')
    }
  }

  private getFulfillment (input: any): Fulfillment {
    // If unlocker object is present on the input, we assume its a legacy input.
    // Convert this legacy input to our current input type
    if (input.unlocker) {
      input.fulfillment = {}
      input.fulfillment.type = input.unlocker.type
      input.fulfillment.data = {
        publickey: input.unlocker.condition.publickey,
        signature: input.unlocker.fulfillment.signature
      }
    }

    const { data } = input.fulfillment
    switch (input.fulfillment.type) {
      case 1:
        return new SingleSignatureFulfillment(1, data.publickey, data.signature)
      case 2:
        const atomicSwapFulfillment: AtomicSwapFulfillment
          = new AtomicSwapFulfillment(1, data.publickey, data.signature)
        if (data.secret) {
          atomicSwapFulfillment.secret = data.secret
        }
        return atomicSwapFulfillment
      case 3:
        const { pairs } = data
        const keypairs = pairs.map((p: KeyPair) => {
          return {
            publickey: p.publickey,
            signature: p.signature
          }
        })
        return new MultisignatureFulfillment(3, keypairs)
      default:
        throw new Error('Fulfillment is not recongnised on data')
    }
  }
}
