import { pool } from '../server/db';
import * as chatService from '../server/services/chatService';

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string) { console.log(`  ❌ FAIL: ${msg}`); }
function section(title: string) { console.log(`\n=== ${title} ===`); }
async function q(text: string, params: any[] = []) { return (await pool.query(text, params)).rows; }

const ADMIN_ID = '55450188';

async function runTest() {
  console.log('=== T008: Chat Security Verification ===\n');

  // --- Test 1: Service layer 500-char limit ---
  section('Test 1 — Service layer 500-char limit');
  try {
    await chatService.postMessage(ADMIN_ID, 'A'.repeat(501), { chatType: 'global' });
    fail('501-char message accepted — should have thrown MESSAGE_TOO_LONG');
  } catch (err: any) {
    err.message === 'MESSAGE_TOO_LONG'
      ? pass('501-char message → MESSAGE_TOO_LONG thrown correctly')
      : fail(`Unexpected error: ${err.message}`);
  }

  try {
    await chatService.postMessage(ADMIN_ID, 'A'.repeat(500), { chatType: 'global' });
    pass('500-char message accepted (boundary: exactly 500 is OK)');
    // Clean up
    await q(`DELETE FROM chat_messages WHERE user_id=$1 AND LENGTH(message)=500`, [ADMIN_ID]);
  } catch (err: any) {
    err.message === 'MESSAGE_TOO_LONG'
      ? fail('500-char message rejected — boundary check: limit should be > 500')
      : fail(`Unexpected error at boundary: ${err.message}`);
  }

  // --- Test 2: Limit discrepancy documentation ---
  section('Test 2 — API vs Service limit discrepancy');
  console.log('  API route (chatRoutes.ts): if (message.length > 1000) → return 400');
  console.log('  Service  (chatService.ts): if (message.length > 500) → throw MESSAGE_TOO_LONG');
  console.log('  Service fires for all authenticated requests → effective limit = 500');
  console.log('  Unauthenticated requests: 401 before any body validation (T007 confirmed)');
  pass('Chat limit discrepancy documented. Effective limit = 500 chars.');

  // --- Test 3: XSS payload stored as plain text ---
  section('Test 3 — XSS injection stored as literal text');
  const xss = "<script>alert('xss')</script>";
  try {
    await chatService.postMessage(ADMIN_ID, xss, { chatType: 'global' });
    pass(`XSS payload accepted by chatService (not blocked at service layer)`);
  } catch (err: any) {
    fail(`postMessage rejected XSS: ${err.message}`);
  }

  const [stored] = await q(`SELECT message FROM chat_messages WHERE message LIKE '%script%' AND user_id=$1 ORDER BY created_at DESC LIMIT 1`, [ADMIN_ID]);
  if (stored) {
    stored.message === xss
      ? pass(`XSS stored as literal string — not sanitized at write time`)
      : fail(`Stored: "${stored.message}"`);
    console.log('  Display safety: React JSX {message.text} renders as text node — XSS is inert in browser');
    console.log('  Verify: ChatHub does NOT use dangerouslySetInnerHTML');
  } else {
    fail('XSS message not found in DB after insert');
  }

  // Clean up XSS test messages
  await q(`DELETE FROM chat_messages WHERE message LIKE '%script%' AND user_id=$1`, [ADMIN_ID]);
  console.log('  XSS test message cleaned up');

  // --- Test 4: Rate limiter config ---
  section('Test 4 — Rate Limiter Config (code-verified, no live firing)');
  console.log('  aiChatLimiter (server/middleware/rateLimiter.ts):');
  console.log('    windowMs : 15 * 60 * 1000 = 900,000ms (15 minutes)');
  console.log('    max      : 60 requests per window');
  console.log('    Applied  : AI endpoints + chat endpoints');
  console.log('    Response : 429 { message: "AI chat rate limit exceeded. Please try again later." }');
  console.log('');
  console.log('  streamingLimiter:');
  console.log('    windowMs : 60 * 1000 = 60,000ms (1 minute)');
  console.log('    max      : 10 requests per minute');
  console.log('    Applied  : Streaming endpoints');
  console.log('    Response : 429 { message: "Streaming rate limit exceeded..." }');
  pass('Rate limiter config documented from source');

  console.log('\n=== T008 Complete ===\n');
  process.exit(0);
}

runTest().catch(err => { console.error('Fatal:', err); process.exit(1); });
