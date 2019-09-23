import { Parser } from '../parser'
import { transactionIdJSON, blockidJSON } from '../testdata/transactionid'
import { Block, Transaction, Wallet } from '../types';

test('test', () => {
  const res = {
    data: blockidJSON
  }
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(res.data)
  expect(parsedResponse instanceof Block)
  console.log(parsedResponse)
});