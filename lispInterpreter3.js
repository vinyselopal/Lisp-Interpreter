const globalEnv = {
  '+': (args) => args.reduce((acc, a) => acc + a, 0),
  '-': (args) => args.reduce((acc, a) => acc - a, 0),
  '*': (args) => args.reduce((acc, a) => acc * a, 1),
  '/': (args) => {
    if (args.length !== 2) return null
    return args.reduce((acc, a) => acc / a, args[0])
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
  pi: 3.14,
  sqrt: (arg) => {
    if (arg.length !== 1) return null
    return Math.sqrt(arg[0])
  }
}

const evaluate = (input) => {
  console.log('in eval')
  input = input.replace(/[(]/g, ' ( ').replace(/[)]/g, ' ) ')
  const output = bracketParser(input, globalEnv) || numberParser(input, globalEnv) || symbolParser(input, globalEnv)
  console.log(output)
  if (!output) return 'invalid expression'
  return output[0]
}

const expressionParser = (input, env = globalEnv) => {
  console.log('in expression')
  input = input.trim()
  return symbolParser(input, env) || numberParser(input, env) || bracketParser(input, env) || procedureParser(input, env) || specialFormParser(input, env)
}

const symbolParser = (input, env) => {
  console.log('in symbol')
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  input = input.slice(literal.length)
  const value = env[literal]
  if (value && typeof value !== 'function') return [value, input]
  return null
}

const numberParser = (input, env) => {
  console.log('in num')
  const pattern = /^(-)?(0|[1-9]\d*)(\.\d+)?((e|E)(\+|-)?\d+)*/
  const value = input.match(pattern)
  if (value) {
    input = input.slice(value[0].length)
    return [parseFloat(value[0]), input]
  }
  return null
}

const bracketParser = (input, env) => {
  console.log('in bracket', input)
  input = input.trim()
  if (input[0] !== '(') return null
  input = input.slice(1)
  if (input.trim().startsWith('(')) return null
  const parsed = expressionParser(input, env)
  input = parsed[1].trim()
  if (!parsed[0]) return null
  if (input[0] === ')') return [parsed[0], input.slice(1)]
  return null
}

const procedureParser = (input, env) => {
  console.log('in procedure')
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  input = input.slice(literal.length)
  const procedure = env[literal]
  if (typeof procedure === 'function') {
    const args = getArguments(input, env)
    const procedureOp = procedure(args[0])
    if (Array.isArray(args) && procedureOp) return [procedureOp, args[1]]
  }
  return null
}

const getArguments = (input, env) => {
  console.log(' in getarg', input)
  input = input.trim()
  let parsed = expressionParser(input)
  if (!parsed[0]) return null
  const args = []
  args.push(parsed[0])
  console.log(args)
  while (!parsed[1].trim().startsWith(')')) {
    console.log(parsed[1])
    parsed = expressionParser(parsed[1])
    args.push(parsed[0])
  }
  return [args, parsed[1]]
}
const specialFormParser = (input, env) => {
  console.log('in specialform')
  for (const prop in specialForms) {
    const parsed = specialForms[prop](input)
    if (parsed) return parsed
  }
  return null
}

const defineParser = (input, env) => {
  console.log('in define', input)
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'define') return null
  input = input.slice(literal.length)
  const symbol = input.match(/[^\s]+/)[0]
  input = input.slice(symbol.length)
  const parsed = expressionParser(input)
  if (!parsed) return null
  env[symbol] = parsed[0]
  return [symbol, parsed[1]]
}

const lambdaParser = (input, env) => {
  console.log('in lambda')
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'lambda') return null
  input = input.slice(literal.length)
  input = input.trim().slice(1).trim()
  let parameters = input.match(/[^)]/)[0]
  input = input.slice(parameters.length).trim().slice(1)
  parameters = parameters.trim().split(/\s+/)
  const func = function (localArgs) {
    const localEnv = Object.create(env)
    parameters.forEach((param, i) => {
      localEnv[param] = localArgs[i]
    })
    const parsed = expressionParser(input, localEnv)
    input = parsed[1]
    return parsed
  }
  return [func, input]
}

const ifParser = (input, env) => {
  console.log('in if')
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  if (literal !== 'if') return null
  input = input.slice(literal.length)
  const parsed1 = expressionParser(input, env)
  const test = parsed1[0]
  const parsed2 = expressionParser(parsed1[1], env)
  const conseq = parsed2[0]
  const parsed3 = expressionParser(parsed2[1], env)
  const alt = parsed3[0]
  const rest = parsed3[1]
  return test ? [conseq, rest] : [alt, rest]
}

const specialForms = {
  define: defineParser,
  lambda: lambdaParser,
  if: ifParser
  // ,
  // // set: setParser,
  // // quote: quoteParser,
  // // begin: beginParser
}
console.log(evaluate('(define r 10)'))
