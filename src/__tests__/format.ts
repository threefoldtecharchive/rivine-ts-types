import { Parser } from '../parser'
import { transactionIdJSON, blockidJSON } from '../testdata/transactionid'
import { Block, Transaction, Wallet, ReponseType } from '../types';

test('test', () => {
  const res = {
    data: blockidJSON
  }
  const parser = new Parser()
  const parsedResponse = parser.ParseJSONResponse(res.data)

  expect(parsedResponse instanceof Block)

  // Example of how to switch on a response
  switch (parsedResponse.kind()) {
    case ReponseType.Block:
      console.log("is a block");
      break
  }

  console.log(parsedResponse)
});