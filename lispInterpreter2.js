// readline and repl
// pressing enter when end bracket missing
// bracket balancing
// environment

const expt = (args) => {
  if (args.length !== 2) throw new Error("'expt' should get two args")
  return args[0] ** args[1]
}
const isSymbol = (env, x) => {
  console.log('in isSymb')
  console.log(env)
  return x in env && typeof env[x] !== 'function'
}
const isNumber = (x) => typeof x === 'number'

const isFunc = (env, x) => {
  console.log('in isFunc')
  return x in env && typeof env[x] === 'function'
}
const globalEnv = {
  '+': (args) => {
    console.log('in add')
    return args.reduce((acc, a) => acc + a, 0)
  },
  '-': (args) => args.reduce((acc, a) => acc - a, args[0]),
  '*': (args) => {
    console.log('in mul')
    return args.reduce((acc, a) => acc * a, 1)
  },
  '/': (args) => {
    if (args.length !== 2) return null
    return args.reduce((acc, a) => acc / a, args[0])
  },
  '=': (args) => {
    if (args.length !== 2) return null
    return args[0] === args[1]
  }
}
const bracketParser = (input, env) => {
  console.log('in bracket')
  input = input.trim().slice(1)
  const parsed = expressionParser(input, env)
  const rest = parsed[1].trim()
  if (rest[0] !== ')') return null
  return [parsed[0], rest.slice(1)]
}
const numberParser = input => {
  console.log('in num')
  const pattern = /^(-)?(0|[1-9]\d*)(\.\d+)?((e|E)(\+|-)?\d+)*/
  const found = pattern.exec(input)
  if (found === null) return null

  const len = found[0].length
  return [parseFloat(input.slice(0, len), 10), input.slice(len)]
}

const defineParser = (input, env) => {
  console.log('in define')
  const symbol = input.match(/[^\s]+/)[0]
  input = input.slice(symbol.length).trim()
  const parsed = expressionParser(input)
  if (parsed === null) return null
  const value = parsed[0]
  const rest = parsed[1]
  env[symbol] = value
  return [symbol, rest]
}
const lambdaParser = (input, env) => {
  console.log('in lambda')

  //  (x) (+ x 2))
  input = input.trim().slice(1).trim()
  let parameters = input.match(/[^)]/)[0]
  input = input.slice(parameters.length).trim().slice(1)
  parameters = parameters.trim().split(/\s+/)
  console.log('params', parameters, input)
  const func = function (localArgs) {
    const localEnv = Object.create(env)
    parameters.forEach((param, i) => {
      localEnv[param] = localArgs[i]
    })
    console.log('local', localEnv)
    const parsed = expressionParser(input, localEnv)
    input = parsed[1]
    return parsed
  }
  return [func, input]
}
const ifParser = (input, env) => {
  console.log('in if', input)
  const parsed1 = expressionParser(input, env)
  const test = parsed1[0]
  parsed1[1] = parsed1[1].trim()
  if (parsed1[1][0] === ')') parsed1[1] = parsed1[1].slice(1)
  const parsed2 = expressionParser(parsed1[1], env)
  const conseq = parsed2[0]
  const parsed3 = expressionParser(parsed2[1], env)
  const alt = parsed3[0]
  const rest = parsed3[1]
  return test ? [conseq, rest] : [alt, rest]
}
const argumentParser = (input, env) => {
  console.log('in arg')
  const args = []
  let current = expressionParser(input, env)
  args.push(current[0])
  while (current[1].trim() !== ')') {
    const parsed = expressionParser(current[1].trim(), env)
    current = parsed[1]
    args.push(parsed[0])
  }
  return [args, current]
}
const atomicExpParser = (input, env) => {
  console.log('in atom', env)
  const operator = input.match(/[^\s]+/)[0]
  const procedure = env[operator]
  input = input.slice(operator.length).trim()
  const parsed = argumentParser(input, env)
  const args = parsed[0]
  const rest = parsed[1]
  return [procedure(args), rest]
}
const operators = {
  define: defineParser,
  lambda: lambdaParser,
  if: ifParser
}
const expressionParser = (input, env = globalEnv) => {
  console.log('in exp')
  console.log(env)
  console.log(input)
  input = input.trim()
  const operator = input.match(/[^\s]+/)[0]
  const opFunc = operators[operator]
  if (opFunc) {
    input = input.slice(operator.length).trim()
    const parsed = opFunc(input, env)
    if (parsed === null) return null
    expValue = parsed[0]
    rest += parsed[1]
  }
  if (operator === "'") return input.slice(1).trim()
  const bracketParsed = bracketParser(input)
  if (bracketParsed !== null) return bracketParsed
  if (isFunc(env, operator)) {
    console.log('in isFuncCond', input)
    const parsed = atomicExpParser(input, env)
    if (parsed === null) return null
    expValue = parsed[0]
    rest += parsed[1]
  }
  const number = numberParser(input)
  if (number) {
    console.log('in number Cond')
    expValue = number[0]
    rest += number[1]
  }
  if (isSymbol(env, operator)) {
    console.log('in isSymbCond')
    expValue = env[operator]
    rest += input.slice(operator.length)
  }
  return [expValue, rest]
}
const lispInterpreter = (input) => {
  console.log('in interpreter')
  if (!input.length) return 'Invalid exp'
  if (input[0] !== '(' && input[0] !== "'" && !isSymbol(globalEnv, input)) return 'Invalid exp'
  const answer = expressionParser(input.replace(/[(]/g, ' ( ').replace(/[)]/g, ' ) '))
  // return answer === null ? 'Invalid exp' : answer[0]
  return answer[0]
}
// console.log(lispInterpreter('(define r (lambda (x) (+ x 2))'))
// console.log(lispInterpreter('(r 2)'))
// console.log(lispInterpreter('(+ 2 (* 4 3)'))
console.log(lispInterpreter('(define evaluate (lambda (x) (if (= x 1) 1 0)))'))
console.log(lispInterpreter('(evaluate 3)'))
// if ' appears inside in expression somewhere
// expression parser should work like value parser in json
