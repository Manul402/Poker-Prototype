let {hand: solver, parse} = require("./pokerHand.js")

let suits = [ '♥', '♦', '♠', '♣' ]

class poker{
    table = []
    q = 0
    deck = []
    bank = 0
    sBlindIndex = 1
    bBlindIndex = 1
    startQ = -1
    secondCircle = false
    smallBlind = 10
    bigBlind = 20
    players = new Map() 
    isRaise = -1
    random = Math.random()
    constructor(players, params){
        let {startStack, bigBlind, smallBlind, random} = params
        this.bigBlind = bigBlind || this.bigBlind
        this.smallBlind = smallBlind || this.smallBlind
        this.random = random || Math.random
        for(let i = 0; i < players.length; i++){
            this.players.set(players[i],{
                id: players[i],
                hand: [],
                stack: startStack,
                bet: 0,
                betted: 0,
                sidePot: 0,
                active: true,
                activeAtCircle: true
            })
        }
        this.incQ()
        this.participants = players
        this.makeDeck()
    }

    incQ(){
        this.q += 1
        if(this.q >= this.players.size){
            this.q = 0
            this.secondCircle = true
        }
        if(this.q >= (this.isRaise !== -1 ? this.isRaise : this.startQ) && this.secondCircle){
            this.secondCircle = false
            this.isRaise = -1;
            this.players.forEach(a=>{
                a.activeAtCircle = true
                this.players.set(a.id, a)
            })
            this.q = this.startQ
            if(this.getPlayer(this.startQ))this.skipNonStackPlayers()
            return true
        }
        return false
    }

    updateBlinds(){
        this.sBlindIndex = this.bBlindIndex
        if(this.bBlindIndex > this.players.size)this.sBlindIndex = -1
        this.bBlindIndex += 1
        if(this.bBlindIndex >= this.players.size)this.bBlindIndex = 0
        let player = this.players.get(new Array(...this.players.keys())[this.bBlindIndex])
        let bet = Math.min(player.stack, this.bigBlind)
        let firstBet = bet
        player.bet += bet
        player.stack -= bet
        this.bank += bet
        this.bet += bet
        let res = {bigBlind: player}
        if(this.sBlindIndex !== -1){
            player = this.players.get(new Array(...this.players.keys())[this.sBlindIndex])
            bet = Math.min(player.stack, this.smallBlind)
            player.bet += bet
            player.stack -= bet
            this.bank += bet
            this.bet = Math.max(bet, firstBet)
            res.smallBlind = player
        }
        return res
    }

    finishCon(){
        let winners = []
        let players = new Map(
            [...this.players]
            .filter(a=> a[1].betted > 0)
          );
        players.forEach(player=>{
            if(player.bet < 0)return;
            player.hand = solver(player.hand, this.table)
            players.set(player.id, player)
        })
        players = new Array(...players.keys()).map(key=>players.get(key))
        players = players.sort((a, b)=> {
            let diff = b.hand.strength - a.hand.strength
            if(diff == 0)return a.betted - b.betted
            return diff
        })
        let i = 0
        let left = 0
        let strength = 0
        let before = 0
        this.UpdateSidePots()
        while(this.bank > left && i < players.length){
            let player = players[i]
            let playerAtTable = this.players.get(player.id)
            let inBank = players.filter(a=> a.hand.strength == player.hand.strength && a.betted >= player.betted)
            if(strength !== player.hand.strength){
                before = 0
                strength = player.hand.strength 
            }else{
                before++
            }
            let prize = player.sidePot/inBank.length - left + (before * player.sidePot/inBank.length)
            left += prize
            playerAtTable.stack += prize
            if(prize > 0)winners.push({id: player.id, prize})
            this.players.set(playerAtTable.id, playerAtTable)
            i++
        }
        return winners
    }

    HangOutTheDeck(){
        for(let i = 0; i < this.deck.length; i++){
            let buff = this.deck[i]
            let rand = Math.random()
            rand = rand.toString()
            rand = rand.slice(rand.length-2)
            rand = new Number("0." + rand)
            let index = parseInt(this.random() * this.deck.length)
            this.deck[i] = this.deck[index]
            this.deck[index] = buff
        }
    }

    makeDeck(){
        this.deck = []
        for(let i = 2; i < 15; i++){
            this.deck.push(i + suits[0])
            this.deck.push(i + suits[1])
            this.deck.push(i + suits[2])
            this.deck.push(i + suits[3])
        }
        this.HangOutTheDeck()
    }

    dropCard(){
        return this.deck.pop()
    }

    con(){
        let winners = this.finishCon()
        if(Array.from(this.players, ([name, value]) => value).filter(a=> a.stack > 0).length == 1)return {state: "End", winner: this.getPlayer().id, commuintyCards: this.table, players: this.players}
        this.bet = 0
        this.makeDeck()
        this.table = []
        this.bank = 0
        this.players.forEach(player=>{
            if(player.stack == 0)return this.players.delete(player.id)
            player.active = true
            player.activeAtCircle = true
            player.sidePot = 0
            player.hand = [this.dropCard(), this.dropCard()]
            player.bet = 0
            player.betted = 0
            this.players.set(player.id, player)
        })
        let blinds = this.updateBlinds()
        if(this.startQ++ >= this.players.size)this.startQ = 0
        this.q = this.startQ
        return {state: "New con", winners, ...blinds}
    }
    getPlayer(q = -1){
        if(q == -1)q = this.q
        let key = Array.from(this.players.keys())[q];   
        return this.players.get(key)
    }
    circle(){
        this.players.forEach(player=>{
            player.betted += player.bet
            player.bet = 0
            this.players.set(player.id, player)
        })
        this.bet = 0
        if(this.table.length == 5)return this.con();
        if(this.table.length == 0){
            this.table.push(this.dropCard())
            this.table.push(this.dropCard())
            this.table.push(this.dropCard())
        }else this.table.push(this.dropCard())
        return false
    }
    skipNonStackPlayers(){
        let stack = 0
        let i = this.q
        let result = false
        while(stack == 0){
            let player = this.getPlayer(i)
            if(player.active && player.activeAtCircle){
                player.activeAtCircle = true
                this.players.set(player.id, player)
                stack = player.stack
                if(stack > 0)break
            }
            player.activeAtCircle = true
            this.players.set(player.id, player)
            if(this.incQ()){
                let res = this.circle()
                i = this.q
                if(!res){
                    result = {state: "New circle"}
                }else result = res
            }
            i++
        }
        return result
    }
    nextQ(raise = -1){
        if(raise !== -1)this.isRaise = raise
        let newCircle = this.incQ()
        let result = this.skipNonStackPlayers()
       if(result.state == "End")return result
       if(newCircle){
        newCircle = this.circle()
        return newCircle ? newCircle : {state: "New circle"}
       }
       return result || {state: "No changes"}
    }
    fold(id){
        let player = id == -1 || id == undefined ? this.getPlayer(-1) : this.players.get(id)
        player.active = false
        this.players.set(player.id, player)
        return {...this.nextQ(), player, action: {name: "fold", bet: player.betted + player.bet}}
    }
    call(id){
        let player = id == -1 || id == undefined ? this.getPlayer(-1) : this.players.get(id)
        let bet = player.stack > (this.bet - player.bet) ? this.bet - player.bet : player.stack
        player.stack -= bet
        player.bet += bet
        this.bank += bet
        this.players.set(player.id, player)
        return {...this.nextQ(), player, action: {name: "call", bet}}
    }
    check(id){
        let player = id == -1 || id == undefined ? this.getPlayer(-1) : this.players.get(id)
        if(player.bet < this.bet)return {errorCode: 1, error: "Player must bet", player, bet: this.bet - player.bet}
        return {...this.nextQ(), player, action: {name: "check", bet: 0}}
    }
    raise(id, bet){
        let player = id == -1 || id == undefined ? this.getPlayer(-1) : this.players.get(id)
        if((bet || -1) <= this.bet - player.bet)return {errorCode: 2, error: "Bet is smaller than required", add: this.bet - player.bet, player}
        if(bet > player.stack) return {errorCode: 2, error: "Player haven't enougth chips", add: bet - player.stack, player}
        if(player.stack < bet)return false
        player.stack -= bet
        player.bet += bet
        this.players.forEach(a=>{
            a.activeAtCircle = true
            this.players.set(a.id, a)
        })
        player.activeAtCircle = false
        this.bet += bet - (this.bet - player.bet + bet)
        this.bank += bet
        this.players.set(player.id, player)
        return {...this.nextQ((new Array(...this.players.keys())).indexOf(player.id)), player, action: {name: "raise", bet}}
    }
    UpdateSidePots(){
        this.players.forEach(player=>{
            let pot = 0
            this.players.forEach(Player=>{
                pot += Player.betted > player.betted ? player.betted : Player.betted
            })
            player.sidePot = pot
            this.players.set(player.id, player)
        })
    }
}

module.exports.parse = parse
module.exports.poker = poker