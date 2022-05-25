
const globalEnv = {
  '+': function (args) {
    console.log([...args])
    return args.reduce((acc, a) => acc + a, 0)
  },
  '-': (args) => args.reduce((acc, a) => acc - a, args[0]),
  '*': (args) => args.reduce((acc, a) => acc * a, args[0]),
  '/': (args) => args.reduce((acc, a) => acc /  a, args[0]),
  expt: (args) => {
    if (args.length !== 2) throw new Error("'expt' should get two arguments")
    return args[0] ** args[1]
  },
  // '>': (...args) => args.reduce((arr, a) => acc ),
  // '<': smaller,
  // '>=': notSmaller,
  // '<=': notGreater,
  // '=': equal,
  isSymbol: (x) => {
    return this.hasOwnProperty(x) //&& typeof this[x] !== "function"   //check if corect
  },
  isNumber: (x) => typeof x ==="number"
}

const numberParser = input => {
  const pattern = /^(-)?(0|[1-9]\d*)(\.\d+)?((e|E)(\+|-)?\d+)*/
  const found = pattern.exec(input)
  if (found === null) return null
  const len = found[0].length
  return [parseFloat(input.slice(0, len), 10), input.slice(len)]
}

const lispInterpreter = (input) => {
  input = input.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim()
  console.log(input)
  if(input[0] !== '(') return 'Not a valid lisp expression'
  final = eval(input.trim().slice(1).trim())
  if(final[1].replace(/\s+/g, "").length !== bracketStack.length) return 'unbalanced parenthesis'
  return final[0]
}

let bracketStack = []
const eval = (input, env = globalEnv) => {
  input = input.trim()
  const literal = input.match(/[^\s]+/)[0]
  const rest = input.slice(literal.length)
  if(input[0] === '(') {
    console.log('in bracket')
    bracketStack.push('(')
    input = input.slice(1).trim()
    return eval(input, env)
  }
  if(env.isSymbol.call(env, literal)) return [env[literal], rest]
  const number = numberParser(input)
  if(number) {
    console.log('in num')
    return number
  }
  if(literal === 'define') {
    console.log('in define')
  input = input.slice(6).trim()
  const variableName = input.match(/[^\s]+/)[0]
  const parsedValue = eval(input.slice(variableName.length), env)
  env[variableName] = parsedValue[0]
  return typeof parsedValue[0] === "function" ? [variableName, parsedValue[1]] : parsedValue
  }
  if(literal === 'lambda') {
    console.log('in lambda')
    input = input.slice(6).trim().slice(1).trim()
    bracketStack.push('(')
    let parameters = input.match(/[^\)]/)[0]          
    input = input.slice(parameters.length).slice(1).trim()
    bracketStack.pop
    parameters = parameters.split(/\s+/)           
    return function(localArgs) {
      const localEnv = Object.create(env)
      parameters.forEach((param, i)=> {
        localEnv[param] = eval(localArgs[i], env)
      })
      return eval(input, localEnv)
    }
  }
  if(typeof env[literal] === "function") {
    const procedure = eval(literal, env)
    let arguments = []
    let parsedCurrent = eval(rest, env)
    if(parsedCurrent[1].trim() !== ")" ){
      do{
        arguments.push(parsedCurrent[0])
        parsedCurrent = eval(parsedCurrent[1])      
      }while(parsedCurrent[1].trim()[0] !== ')') 
      arguments.push(parsedCurrent[0])
      bracketStack.pop()
    }
    bracketStack.pop()
    return [procedure(...arguments.map((arg) => eval(arg, env))), parsedCurrent[1].trim().slice(1)]
  }
}
console.log(lispInterpreter('(define twice (lambda (x) (* 2 x)))'))
