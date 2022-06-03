const process = require('process')
const readline = require('readline')
const interpret = (input) => evaluate(input)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
rl.on('close', function () {
  process.exit(0)
})
repl()
function repl () {
  rl.question('\n=>', function (input) {
    if (input === ':q' || input === ':quit') {
      rl.close()
    }
    try {
      console.log(interpret(input))
    } catch (err) {
      console.log(err)
    } finally {
      repl()
    }
  })
}
const globalEnv = {
  '+': (args) => {
    if (args.length !== 2) return null
    return args[0] + args[1]
  },
  '-': (args) => {
    if (args.length !== 2) return null
    return args[0] - args[1]
  },
  '*': (args) => {
    if (args.length !== 2) return null
    const ans = args[0] * args[1]
    return ans
  },
  '/': (args) => {
    if (args.length !== 2) return null
    return args[0] / args[1]
  },
  '>': (args) => {
    if (args.length !== 2) return null
    return args[0] > args[1]
  },
  '<': (args) => {
    if (args.length !== 2) return null
    return args[0] < args[1]
  },
  '=': (args) => {
    if (args.length !== 2) return null
    return args[0] === args[1]
  },
  '>=': (args) => {
    if (args.length !== 2) return null
    return args[0] >= args[1]
  },
  '<=': (args) => {
    if (args.length !== 2) return null
    return args[0] <= args[1]
  },
  map: (mapper, args) => args.map(mapper),

  list: (args) => args,

  cons: ([head, tail]) => [head, ...(Array.isArray(tail) ? tail : [tail])],

  pi: 3.14,

  sqrt: (arg) => {
    if (arg.length !== 1) return null
    return Math.sqrt(arg[0])
  }
}

const evaluate = (input) => {
  // console.log('in eval')
  input = input.replace(/[(]/g, ' ( ').replace(/[)]/g, ' ) ')

  let output = bracketParser(input, globalEnv) || numberParser(input, globalEnv) || symbolParser(input, globalEnv)

  if (!output) {
    // console.log('return evaluate')
    return 'invalid expression'
  }
  while (Array.isArray(output) && typeof output[output.length - 1] === 'string' && output.length > 1) {
    output = output.slice(0, output.length - 1)
    if (output.length === 1 && Array.isArray(output[0])) output = output[0]
  }
  // potential threats with block for slicing the array
  // console.log('return evaluate')
  return output[0]
}

const expressionParser = (input, env = globalEnv) => {
  // console.log('in expression')
  input = input.trim()

  const output = symbolParser(input, env) || numberParser(input, env) || bracketParser(input, env) || procedureParser(input, env) || specialFormParser(input, env)
  // console.log('return expression')
  return output
}

const symbolParser = (input, env) => {
  // console.log('in symbol')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  input = input.slice(literal.length)

  const value = env[literal]

  if (value !== undefined && typeof value !== 'function') {
    // console.log('return symbol')

    return [value, input]
  }

  return null
}

const numberParser = (input, env) => {
  // console.log('in num')

  const pattern = /^(-)?(0|[1-9]\d*)(\.\d+)?((e|E)(\+|-)?\d+)*/
  const value = input.match(pattern)

  if (value) {
    input = input.slice(value[0].length)
    // console.log('return num')

    return [parseFloat(value[0]), input]
  }

  return null
}

const bracketParser = (input, env) => {
  // console.log('in bracket')
  input = input.trim()

  if (input[0] !== '(') return null

  input = input.slice(1)
  if (input.trim().startsWith('(')) return null

  const parsed = expressionParser(input, env)
  if (parsed === null) return null

  if (!Array.isArray(parsed)) {
    // console.log('return bracket')

    return [parsed, '']
  }
  input = parsed[1].trim()

  if (input[0] === ')') {
    // console.log('return bracket')

    return [parsed[0], input.slice(1)]
  }
}

const procedureParser = (input, env) => {
  // console.log('in procedure')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  input = input.slice(literal.length)

  const procedure = env[literal]

  if (typeof procedure === 'function') {
    const args = getArguments(input, env)
    const procedureOp = procedure(args[0])

    if (Array.isArray(args) && procedureOp !== null) {
      // console.log('return procedure')

      return [procedureOp, args[1]]
    }
  }

  return null
}

const getArguments = (input, env) => {
  // console.log(' in getarg')
  input = input.trim()

  let parsed = expressionParser(input, env)
  let arg = parsed[0]

  while (Array.isArray(arg) && typeof arg[arg.length - 1] === 'string') {
    arg = arg[0]
    if (!arg) return null
  }
  const args = []
  args.push(arg)

  input = parsed[1].trim()
  // console.log('onebyone', args)

  while (!parsed[1].trim().startsWith(')')) {
    parsed = expressionParser(parsed[1], env)
    let arg = parsed[0]

    while (Array.isArray(arg) && typeof arg[arg.length - 1] === 'string') {
      arg = arg[0]
      if (!arg) return null
    }
    args.push(arg)
  }
  // console.log('onebyone', args)
  input = parsed[1].trim()

  // console.log('return getarg')
  return [args, input]
}
const specialFormParser = (input, env) => {
  // console.log('in specialform')

  for (const prop in specialForms) {
    const parsed = specialForms[prop](input, env)

    if (parsed) {
      // console.log('return specialform')
      return parsed
    }
  }

  return null
}

const defineParser = (input, env) => {
  // console.log('in define')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'define') return null

  input = input.slice(literal.length).trim()

  const symbol = input.match(/[^\s]+/)[0]
  input = input.slice(symbol.length)

  const parsed = expressionParser(input)

  if (!parsed) return null

  env[symbol] = parsed[0]
  // console.log('return define')

  return Array.isArray(parsed) ? [symbol, parsed[1]] : symbol
}

const lambdaParser = (input, env) => {
  // console.log('in lambda')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'lambda') return null

  input = input.slice(literal.length)
  input = input.trim().slice(1).trim()

  let parameters = input.match(/[^)]+/)[0]
  input = input.slice(parameters.length).trim().slice(1).trim()

  let bracketCount = 0
  let position = 0

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '(') bracketCount++
    if (input[i] === ')') bracketCount--

    if (bracketCount < 0) {
      position = i

      break
    }
  }

  parameters = parameters.trim().split(/\s+/)

  const func = function (localArgs) {
    const localEnv = Object.create(env)

    parameters.forEach((param, i) => {
      localEnv[param] = localArgs[i]
    })

    const parsed = expressionParser(input, localEnv)

    return parsed
  }
  // console.log('return lambda', input)
  const rest = input.slice(position)

  return [func, rest]
}

const ifParser = (input, env) => {
  // console.log('in if')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'if') return null

  input = input.slice(literal.length)
  const parsed1 = expressionParser(input, env)
  const test = parsed1[0]

  const parsed2 = expressionParser(parsed1[1], env)
  const conseq = parsed2[0]

  let bracketCount = 0
  let position = 0

  input = parsed2[1]

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '(') bracketCount++
    if (input[i] === ')') bracketCount--

    if (bracketCount < 0) {
      position = i
      break
    }
  }
  input = input.slice(position)
  if (test) return [conseq, input]

  const parsed3 = expressionParser(parsed2[1], env)
  const alt = parsed3[0]
  const rest = parsed3[1]

  // console.log('return if')
  return [alt, rest]
}

const setParser = (input, env) => {
  // console.log('in set')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'set!') return null
  input = input.slice(literal.length).trim()

  const symbol = input.match(/[^\s]+/)[0]
  input = input.slice(symbol.length)

  if (env[symbol] && typeof env[symbol] !== 'function') {
    const value = expressionParser(input, env)
    env[symbol] = value

    // console.log('return set')
    return [symbol, input]
  }

  return null
}

const quoteParser = (input, env) => {
  // console.log('in quote')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'quote') return null

  input = input.slice(literal.length).trim()

  if (input[0] !== '(') {
    const string = input.match(/[^\s]+/)[0]
    input = input.slice(string.length)

    // console.log('return quote')
    return [string, input]
  }
  input = input.slice(1)

  const string = input.match(/[^)]+/)[0]
  input = input.slice(string.length)

  // console.log('return quote')
  return [string, input.slice(1)]
}

const beginParser = (input, env) => {
  // console.log('in begin')
  input = input.trim()

  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'begin') return null

  input = input.slice(literal.length).trim()
  let value
  let parsed = expressionParser(input, env)

  while (input !== ')') {
    parsed = expressionParser(parsed[1], env)
    value = parsed[0]
    input = parsed[1].trim()
  }

  // console.log('return begin')
  return [value, input]
}
const specialForms = {
  define: defineParser,
  lambda: lambdaParser,
  if: ifParser,
  set: setParser,
  quote: quoteParser,
  begin: beginParser
}

// // console.log(evaluate('(define func (lambda (x) (if (= x 1) 1 0)))'))
// // console.log(evaluate('(func 1)'))
// // console.log(evaluate('(define r 1)'))
// // console.log(evaluate('(set! r 2)'))
// // console.log(evaluate('(r)'))
// // console.log(evaluate('(define r quote (nfkjefkejdk))'))
// // console.log(evaluate('(begin (define r 10) (* pi (* r r)))'))
// // console.log(evaluate('(define circle-area (lambda (r) (* pi (* r r)))'))
// // console.log(evaluate('(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))'))
// // console.log(evaluate('(circle-area (fact 10))'))

// console.log(evaluate('(define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1)) (fib (- n 2))))))'))
// // console.log(evaluate('(define range (lambda (a b) (if (= a b) (quote ()) (cons a (range (+ a 1) b)))))'))
// // console.log(evaluate('(range 0 4)'))
// console.log(evaluate('(fib 10)'))
