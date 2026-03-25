// ═══════════════════════════════════════════════════════
// Kamino Protocol Constants
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// Kamino Adaptor Program ID (used by Ranger/Voltr)
export const KAMINO_ADAPTOR_PROGRAM_ID = new PublicKey(
  "KAMino1o1SKxEt8eyHKGwFbMUNkPSm2op83FYfRBQ5G"
);

// Kamino Lending Program
export const KAMINO_LENDING_PROGRAM_ID = new PublicKey(
  "KLend2g3cP87ber41GqLi3aGJVAkYmia8FziYvUX8we"
);

// Kamino Main Market (USDC lending)
export const KAMINO_MAIN_MARKET = new PublicKey(
  "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"
);

// Kamino USDC Reserve
export const KAMINO_USDC_RESERVE = new PublicKey(
  "D6q6wuQSrifJKDDLCuoP5bMpM1BoAhZSfVjdqmb7beg"
);

// Kamino JLP Market (alternative)
export const KAMINO_JLP_MARKET = new PublicKey(
  "DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek"
);

// Kamino Farms Program (for reward claiming)
export const KAMINO_FARMS_PROGRAM_ID = new PublicKey(
  "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr"
);
