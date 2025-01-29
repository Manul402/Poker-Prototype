let cards_rank = {"J": 11, "Q": 12, "K": 13, "A": 14}
let combs = ["nothing", "pair", "two pair", "three-of-a-kind", "straight", "flush", "full house", "four-of-a-kind", "straight-flush"]

function parse(hands){
    return hands.map(hand=> {
        hand = new Array(...hand)
        hand.pop()
        hand = hand.join("")
        let value = cards_rank[hand]
        return parseInt(value ? value : hand)
    }).sort((a, b) => a-b)
}

function unparse(hands){
    return hands.map(hand=> {
        let copy = hand
        hand = new Array(...hand.toString())
        hand.pop()
        hand = hand.join("")
        for(i in cards_rank){
            let value = cards_rank[i]
            if(value == hand)return i + copy[copy.length-1]
        }
        return copy
    })
}

function getLocalStrenght(hands){
    return hands.reverse().reduce((acc, value, index) => acc + value * ((index+1)**13),0)
}

function getStrength(hand){
    return combs.indexOf(hand.type) * 1356446145699 + getLocalStrenght(hand.ranks)
}

function checkStreight(hands){
    for(let i = 1; i < hands.length; i++){
        if(hands[i] - hands[i-1] !== 1)return false
    }
    return true
}

function getComb(hands){
    let flush = new Set(hands.map(a=> a[a.length-1])).size == 1
    hands = parse(hands)
    hands = hands.sort((a, b) => {
        let diff = hands.filter(n=> a == n).length - hands.filter(n=> b == n).length
        if(diff == 0)return a-b
        return diff
    })
    let uniq = new Array(...new Set(hands))
    let help = hands.filter(a=> a == uniq[0]).length
    let streight = checkStreight(hands)
    if(flush && streight) return {type: combs[combs.length-1], ranks: uniq}
    if(uniq.length == 2 && (help == 1 || help == 4))return {type: combs[combs.length-2], ranks: uniq}
    if(uniq.length == 2)return {type: combs[combs.length-3], ranks: uniq}
    if(flush)return {type: combs[combs.length-4], ranks: uniq}
    if(streight)return {type: combs[combs.length-5], ranks: uniq}
    if(uniq.length == 3 && (help == 3 || hands.filter(a=> a == uniq[1]).length) == 3 || hands.filter(a=> a == uniq[2]).length == 3)return {type: combs[combs.length-6], ranks: uniq}
    if(uniq.length == 3)return {type: combs[combs.length-7], ranks: uniq}
    if(uniq.length == 4)return {type: combs[combs.length-8], ranks: uniq}
    return {type: combs[combs.length-9], ranks: uniq}
}

function hand(holeCards, communityCards) {
    let cards = holeCards.concat(communityCards)
    let best = {strength: 0}
    for(i in cards){
        for(let j = i; j < cards.length; j++){
            let variant = new Array(...cards)
            variant.splice(i, 1)
            variant.splice(j-1, 1)
            let comb = getComb(variant)
            let strength = getStrength(comb)
            if(strength > best.strength)best = {...comb, strength: strength}
        }
    }
    best.ranks = unparse(best.ranks)
    return best
}

module.exports.hand = hand
module.exports.parse = unparse