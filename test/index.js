const {poker, parse} = require("../poker.js")

let players = ["Vasya", "Vitalik", "Sasha"]
let game = new poker(players, {startStack: 1000, random: Math.random})

function logTable(game){

    console.log(`------------------------------------------

Table Updated

Bank: ${game.bank}
Community cards:${parse(game.table).join(" ")}
`)
        
    for(let i = 0; i < game.players.size; i++){
        let player = game.getPlayer(i)
        console.log(`
${player.id} 
Stack: ${player.stack}\t\tBet: ${player.bet}
${parse(player.hand).join(" ")}

`)
    }
}

//imitation

function log_winners(game, res){
    let {winners, bigBlind, smallBlind} = res
    console.log("------------------------------------------\n\nNew Con")
    for(let i = 0; i < winners.length; i++){
        let winner = winners[i]
        console.log(`${winner.id} забирает ${winner.prize}`)
    }
    console.log(`${bigBlind.id} поставил ${bigBlind.bet}, в качестве большого блайнда`)
    console.log(`${smallBlind?.id} поставил ${smallBlind?.bet}, в качестве малого блайнда`)
    logTable(game)
}

function log_action(res){
    if(res.errorCode !== undefined)return console.log(res.player.id + " " + res.error)
    console.log(res.player.id + ` голосует ${res.action.name} со ставкой ${res.action.bet}`)
}

function logger(func, game){
    return (...args)=>{
        if(args[0] == undefined)args[0] = game.getPlayer().id
        let res = func.apply(game, args)
        if(!res)return;
        log_action(res)
        if(res.state == "New circle")logTable(game)
        if(res.state == "New con")log_winners(game, res)
        if(res.state == "End")console.log(res.winner + " Победил (а)")
        return res
    }
}

game.con()

let check = logger(game.check, game)
let call = logger(game.call, game)
let raise = logger(game.raise, game)
let fold  = logger(game.fold, game)

logTable(game)


raise(-1, 40)
call()
call()

check()
check()
check()

fold()
raise(-1, 20)
call()

check()
check()
