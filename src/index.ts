import { Transaction, Block, Wallet } from './types';
import { ParseBlock } from './format';

export const FormatAPIResponse = (res: any): Transaction|Block|Wallet|{} => {
  if (res.hashtype === 'blockid' || res.block) {
    return ParseBlock(res.block);
  }
  return {};
};
