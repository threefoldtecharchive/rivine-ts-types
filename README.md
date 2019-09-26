# Rivine Typescript

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![NPM version](https://img.shields.io/npm/v/rivine-ts-types.svg?style=flat)](https://npmjs.org/package/rivine-ts-types)

> A Typescript library for usage in the browser

## Installation

```sh
npm install rivine-ts-types
```

## Usage

```javascipt
import { Parser } from 'rivine-ts-types'

const myParser = new Parser(precision)

// In case explorer/hashes is called
const parsedResponse = myParser.ParseHashResponseJSON(response, hash)

// In case explorer/blocks is called
const parsedResponse = myParser.ParseBlockResponseJSON(response)
```

## License

MIT