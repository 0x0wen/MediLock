import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Medilock } from "../target/types/medilock";

describe("Basic Test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Medilock as Program<Medilock>;

  it("Can access the program", () => {
    console.log("Program ID:", program.programId.toString());
    // Just check if we can access basic program properties
  });
});