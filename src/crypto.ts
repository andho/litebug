async function hash(string: string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer)));
}

export function generateCodeVerifier() {
  var rand = new Uint8Array(32);
  crypto.getRandomValues(rand);
  return Buffer.from(rand).toString('hex');
}
export async function generateCodeChallenge(code_verifier: string) {
  return btoa(await hash(code_verifier)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
