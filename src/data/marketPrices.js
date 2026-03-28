/**
 * Static average market prices (INR per kg/unit).
 * In production this would come from a government API or scraped data.
 */
const MARKET_PRICES = {
  vegetables: {
    tomato: 40,
    potato: 30,
    onion: 35,
    carrot: 50,
    spinach: 30,
    capsicum: 60,
    brinjal: 35,
    cabbage: 25,
    cauliflower: 40,
    beans: 70,
    cucumber: 30,
    peas: 80,
    ladyfinger: 45,
    radish: 25,
    beetroot: 40,
    default: 40,
  },
  fruits: {
    apple: 150,
    banana: 40,
    mango: 100,
    orange: 60,
    grapes: 80,
    papaya: 40,
    watermelon: 25,
    pomegranate: 120,
    guava: 50,
    pineapple: 60,
    strawberry: 200,
    default: 70,
  },
  milk: {
    default: 55,
    "cow milk": 55,
    "buffalo milk": 65,
    "a2 milk": 80,
    curd: 50,
    paneer: 300,
    ghee: 500,
    butter: 450,
  },
  eggs: {
    default: 7,
    "country eggs": 10,
    "farm eggs": 7,
    "organic eggs": 12,
  },
  other: {
    honey: 350,
    jaggery: 80,
    rice: 50,
    wheat: 35,
    default: 50,
  },
};

export default MARKET_PRICES;
