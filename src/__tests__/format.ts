import { Parser } from '../parser'
import { transactionIdJSON, blockidJSON, unlockhash, unlockhashBlockCreator, coinoutputIdJSON, unspentCoinoutputIdJSON, unspentCoinOutputIDBlockCreatorJSON, spentCoinOutputIdBlockCreatorJSON, unspentBlockStakeOutputIdJSON } from '../testdata/data'
import { Block, Transaction, Wallet, ResponseType, CoinOutputInfo, BlockstakeOutputInfo } from '../types';
import { first } from 'lodash'
import { SingleSignatureFulfillment } from '../fulfillmentTypes';

test('test parsing block', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(blockidJSON) as Block;

  expect(parsedResponse instanceof Block)
  expect(parsedResponse.kind()).toBe(ResponseType.Block);

  const expectedBlockId = '2c8cc0b42b6232dcab8d27472781cfecfcab9fcae36d776672244016b69cead5';

  expect(parsedResponse.id).toBe(expectedBlockId);
  expect(parsedResponse.height).toBe(367184);
  expect(parsedResponse.timestamp).toBe(1568963542);

  expect(parsedResponse.transactions.length).toBe(3);

  const firstTx = first(parsedResponse.transactions) as Transaction;
  expect(firstTx instanceof Transaction);
  expect(firstTx.blockId).toBe(expectedBlockId);

  // Check if everything else is correct
  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing transaction', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(transactionIdJSON) as Transaction;

  expect(parsedResponse instanceof Transaction)
  expect(parsedResponse.kind()).toBe(ResponseType.Transaction);

  expect(parsedResponse.id).toBe('a759d010ec638cef7f06565f04f4d7c06d66ca4e02aa342ecce001d95135087e');
  expect(parsedResponse.unconfirmed).toBe(false);
  expect(parsedResponse.version).toBe(1);

  if (parsedResponse.blockstakeInputs) {
    expect(parsedResponse.blockstakeInputs.length).toBe(1);
    const firstBsInput = first(parsedResponse.blockstakeInputs);
    if (firstBsInput) {
      expect(firstBsInput.parentid).toBe('90fa5e4456ebaefc77e9e2852199e1003dced4bac65e6e2e08b70690f97013d0');
      expect(firstBsInput instanceof SingleSignatureFulfillment);
      expect(firstBsInput.fulfillment.getFulfillmentTypeAsString()).toBe('Single Signature Fulfillment')

      const singleSigFulfillment = firstBsInput.fulfillment as SingleSignatureFulfillment;
      expect(singleSigFulfillment.publicKey).toBe('ed25519:b76697f1517455d0fa41fe57c2b54c80cbdd9761393f7e545db747482eb2727b');
    }
  }

  // Check if everything else is correct
  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing unlockhash', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(unlockhash) as Wallet;

  expect(parsedResponse instanceof Wallet)

  expect(parsedResponse.isBlockCreator).toBe(false);
  expect(parsedResponse.address).toBe('0130241fe6fa22f547e9cf2e268af55d117bfe5fbb02894eec42b906a5a9c41ad69d91e6776af1');
  expect(parsedResponse.confirmedCoinBalance.toString()).toBe('900');
  expect(parsedResponse.confirmedBlockstakeBalance.toString()).toBe('0');

  if (parsedResponse.coinOutputs) {
    expect(parsedResponse.coinOutputs.length).toBe(3);
  }
  if (parsedResponse.transactions) {
    expect(parsedResponse.transactions.length).toBe(3);
  }

  // Check if everything else is correct
  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing unlockhash blockcreator', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(unlockhashBlockCreator) as Wallet;

  expect(parsedResponse instanceof Wallet)

  expect(parsedResponse.isBlockCreator).toBe(true);
  expect(parsedResponse.address).toBe('015a080a9259b9d4aaa550e2156f49b1a79a64c7ea463d810d4493e8242e6791584fbdac553e6f');
  expect(parsedResponse.confirmedCoinBalance.toString()).toBe('100000070');
  expect(parsedResponse.confirmedBlockstakeBalance.toString()).toBe('3000');

  if (parsedResponse.minerPayouts) {
    expect(parsedResponse.minerPayouts.length).toBe(7);
  }
  if (parsedResponse.coinOutputsBlockCreator) {
    expect(parsedResponse.coinOutputsBlockCreator.length).toBe(1);
  }
  if (parsedResponse.blockStakesOutputsBlockCreator) {
    expect(parsedResponse.blockStakesOutputsBlockCreator.length).toBe(8);
  }

  // Check if everything else is correct
  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing a spent coin output id', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(coinoutputIdJSON) as CoinOutputInfo;

  expect(parsedResponse instanceof CoinOutputInfo)
  expect(parsedResponse.output).toBeTruthy();
  expect(parsedResponse.input).toBeTruthy();

  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing an unspent coin output id', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(unspentCoinoutputIdJSON)

  expect(parsedResponse instanceof CoinOutputInfo)
  expect(parsedResponse.output).toBeTruthy();

  // Since its unspent, no input will be found
  expect(parsedResponse.input).toBeUndefined();

  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing a spent coin output id for blockcreator', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(spentCoinOutputIdBlockCreatorJSON) as CoinOutputInfo;

  expect(parsedResponse instanceof CoinOutputInfo)
  expect(parsedResponse.output).toBeTruthy();
  expect(parsedResponse.input).toBeTruthy();

  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing an unspent coin output id for blockcreator', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(unspentCoinOutputIDBlockCreatorJSON) as CoinOutputInfo

  expect(parsedResponse instanceof CoinOutputInfo)
  expect(parsedResponse.output).toBeTruthy();
  expect(parsedResponse.output.isBlockCreatorReward).toBe(true);
  expect(parsedResponse.output.blockId).toBeTruthy();

  // Since its unspent, no input will be found
  expect(parsedResponse.input).toBeUndefined();

  expect(parsedResponse).toMatchSnapshot();
});

test('test parsing an unspent blockstake output id', () => {
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(unspentBlockStakeOutputIdJSON) as BlockstakeOutputInfo

  expect(parsedResponse instanceof BlockstakeOutputInfo)
  expect(parsedResponse.output).toBeTruthy();

  // // Since its unspent, no input will be found
  expect(parsedResponse.input).toBeUndefined();

  expect(parsedResponse).toMatchSnapshot();
});