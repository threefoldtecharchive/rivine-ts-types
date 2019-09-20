import { FormatAPIResponse } from '../index'
import { transactionIdJSON, blockidJSON } from '../testdata/transactionid'
import { Block, Transaction } from '../types';

test('test', () => {
  const res = {
    data: blockidJSON
  }
  const formatted = FormatAPIResponse(res.data)
  expect(formatted instanceof Block)
  console.log(formatted)
});