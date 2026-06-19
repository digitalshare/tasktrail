import { chat, DEFAULT_MODEL } from "./nebius.js";

// Run with: npm run nebius:demo
const reply = await chat("In one short sentence, what is Nebius Token Factory?");
console.log(`[${DEFAULT_MODEL}] ${reply}`);
