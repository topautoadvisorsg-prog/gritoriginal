import { syncFighterSchema, syncPayloadSchema } from "./sync-schemas";

// Test suite for sync-schemas
function testSchemas() {
  console.log("--- Starting Schema Validation Tests ---");

  // 1. Valid Fighter
  const validFighter = {
    firstName: "Conor",
    lastName: "McGregor",
    nickname: "The Notorious",
    nationality: "Ireland",
    weightClass: "Lightweight",
    height: 69,
    reach: 74,
    record: { wins: 22, losses: 6, draws: 0 },
    stats: { strikeAccuracy: "49%", takedownAccuracy: "55%" },
    status: "active"
  };
  const fighterResult = syncFighterSchema.safeParse(validFighter);
  console.log("Valid Fighter Test:", fighterResult.success ? "PASSED" : "FAILED", fighterResult.success ? "" : fighterResult.error.issues);

  // 2. Invalid Fighter (Missing lastName)
  const invalidFighter = {
    firstName: "Conor",
    weightClass: "Lightweight"
  };
  const invalidResult = syncFighterSchema.safeParse(invalidFighter);
  console.log("Invalid Fighter Test (Missing fields):", !invalidResult.success ? "PASSED" : "FAILED");

  // 3. Valid Payload
  const validPayload = {
    sourceType: "fighter",
    actionType: "create",
    dataType: "full_profile",
    data: validFighter
  };
  const payloadResult = syncPayloadSchema.safeParse(validPayload);
  console.log("Valid Payload Test:", payloadResult.success ? "PASSED" : "FAILED");

  // 4. Invalid Payload (Wrong actionType)
  const invalidPayload = {
    sourceType: "fighter",
    actionType: "invalid_action",
    data: validFighter
  };
  const invalidPayloadResult = syncPayloadSchema.safeParse(invalidPayload);
  console.log("Invalid Payload Test (Wrong action):", !invalidPayloadResult.success ? "PASSED" : "FAILED");

  console.log("--- Schema Validation Tests Complete ---");
}

testSchemas();
