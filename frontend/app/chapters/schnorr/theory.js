import { p } from '../../chapter-engine.js';

export const schnorrChapter = {
  id: 'schnorr-zkp',
  num: '05.1',
  tag: 'Signatures & ZKP',
  tagClass: 'hash',
  title: 'Schnorr Authentication & Zero-Knowledge Proofs',
  desc: 'Understand interactive zero-knowledge proofs, the Schnorr authentication protocol, and the Fiat-Shamir transformation into digital signatures.',
  concepts: ['Zero-Knowledge', 'Schnorr Protocol', 'Fiat-Shamir Transform', 'Digital Signatures'],
  topbarTitle: 'Exercise 05.1 — Schnorr & ZK-Protocols',

  blocks: [
    // ── Block 0: Introduction to Public-Key Authentication ─────────────────
    {
      kind: 'text',
      title: '1. Public-Key Authentication & ZK-Proofs',
      content: [
        p('In traditional password or symmetric challenge-response protocols, the verifier must hold secret material. If the verifier is compromised, the secret leaks.'),
        p('With **Public-Key Challenge-Response**, the prover (Alice) proves she knows her private key `a` without ever revealing it to the verifier (Bob). Bob only needs Alice’s public key `A = g^a mod p`.'),
        p('An authentication protocol must satisfy three fundamental properties:'),
        {
          ul: [
            '**Completeness:** An honest prover who knows the private key will always successfully convince an honest verifier.',
            '**Soundness:** A cheating prover (Eve) who does not know the private key can only succeed with negligibly small probability.',
            '**Zero-Knowledge:** The verifier learns *nothing* from the interaction other than the fact that the prover knows the secret.'
          ]
        }
      ]
    },

    // ── Block 1: The Interactive Schnorr Protocol ──────────────────────────
    {
      kind: 'text',
      title: '2. The Schnorr Authentication Protocol',
      content: [
        p('The **Schnorr Authentication Protocol** (Claus Schnorr, 1991) is a 3-pass interactive protocol (Sigma protocol) operating over a cyclic group of order `q` with generator `g`.'),
        p('Alice’s key pair is `(a, A)` where `A = g^a mod p`. The protocol proceeds in three steps:'),
        {
          ol: [
            '**Commitment:** Alice chooses a fresh, random ephemeral key `v` in `Z_q`, computes `V = g^v mod p`, and sends `V` to Bob.',
            '**Challenge:** Bob picks a random challenge `c` from `Z_q` and sends it to Alice.',
            '**Response:** Alice computes `r = (v - c * a) mod q` and sends `r` to Bob.'
          ]
        },
        p('Bob verifies that:'),
        {
          text: 'V = g^r * A^c mod p',
          style: 'font-family: monospace; background: rgba(255,255,255,0.05); padding: 8px 12px; border-left: 3px solid #3b82f6; margin: 10px 0;'
        },
        p('If the Discrete Logarithm (DL) problem is hard, Eve cannot compute `a` from `A`. Her probability of cheating on a random challenge `c` is only `1 / q`.')
      ]
    },

    // ── Block 2: Key Formulas ──────────────────────────────────────────────
    {
      kind: 'formula',
      title: 'Schnorr Verification Equation Breakdown',
      lines: [
        'g^r * A^c  =  g^(v - c*a) * (g^a)^c',
        '           =  g^(v - c*a) * g^(c*a)',
        '           =  g^(v - c*a + c*a)',
        '           =  g^v  =  V  (mod p)'
      ],
      note: 'Notice how the secret key `a` cancels out perfectly during Bob’s verification.'
    },

    // ── Block 3: Fiat-Shamir & Digital Signatures ─────────────────────────
    {
      kind: 'text',
      title: '3. Non-Interactive Proofs & Schnorr Signatures',
      content: [
        p('To convert an interactive identification scheme into a non-interactive **Digital Signature**, we apply the **Fiat-Shamir Transform** (1986).'),
        p('Instead of waiting for Bob to supply a random challenge `c`, Alice computes the challenge herself using a cryptographic hash function `h` acting as a Random Oracle:'),
        {
          text: 'c = h(p || g || A || V || m)',
          style: 'font-family: monospace; background: rgba(255,255,255,0.05); padding: 8px 12px; border-left: 3px solid #10b981; margin: 10px 0;'
        },
        p('The signature for message `m` consists of the pair `(V, r)` [or `(c, r)`]. Anyone with public key `A` can recompute `c` and check if `V == g^r * A^c`.'),
        {
          text: '⚠️ CRITICAL WARNING: Nonce Reuse Vulnerability',
          class: 'ex-p-warning',
          style: 'color: #ef4444; font-weight: bold;'
        },
        p('The ephemeral key `v` must be chosen randomly and **NEVER reused**. If Alice signs two different messages (`m1` and `m2`) with the same ephemeral key `v` (hence the same `V`), an attacker can easily recover her private key `a`!')
      ]
    },

    // ── Block 4: Check Understanding Exercises ─────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Exercise 1 — Understanding Schnorr Protocols',
      items: [
        {
          num: '1.1',
          title: 'Verification Equation',
          bodyHtml: p('In the Schnorr authentication protocol, if `v = 15`, `c = 3`, `a = 4`, and `q = 100`, what is the value of response `r`?'),
          hint: 'Recall that response `r = (v - c * a) mod q`.',
          input: {
            type: 'text',
            placeholder: 'r = ...',
            width: '120px'
          },
          check: (parsedValue) => {
            const num = parseInt(parsedValue, 10);
            // r = (15 - 3 * 4) mod 100 = (15 - 12) = 3
            const correct = num === 3;
            return {
              correct,
              message: correct
                ? '🎉 Correct! `r = 15 - (3 * 4) = 3`.'
                : 'Incorrect. Apply `r = (v - c * a) mod q` where `v = 15`, `c = 3`, `a = 4`.'
            };
          }
        },
        {
          num: '1.2',
          title: 'The Fiat-Shamir Transformation',
          bodyHtml: p('What component replaces the verifier’s interactive challenge `c` in the Fiat-Shamir transformation?'),
          input: {
            type: 'mc',
            options: [
              { label: 'A symmetric key encrypted with RSA', value: 'rsa' },
              { label: 'A cryptographic hash of the commitment, public key, and message', value: 'hash' },
              { label: 'A pre-shared password stored in Bob’s device', value: 'password' },
              { label: 'A random prime generated by the prover', value: 'prime' }
            ]
          },
          check: (parsedValue) => {
            const correct = parsedValue === 'hash';
            return {
              correct,
              message: correct
                ? '🎉 Correct! Fiat-Shamir replaces the interactive challenge with `c = h(public_params || V || m)`.'
                : 'Incorrect. Remember that the challenge is turned non-interactive by hashing the commitment and message.'
            };
          }
        }
      ]
    }
  ]
};
