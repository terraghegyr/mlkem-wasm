/* tslint:disable */
/* eslint-disable */
/**
* @returns {any}
*/
export function keygen(): any;
/**
* @param {string} ciphertext_b64
* @param {string} secret_key_b64
* @returns {string}
*/
export function decapsulate(ciphertext_b64: string, secret_key_b64: string): string;
/**
* @param {string} public_key_b64
* @returns {any}
*/
export function encapsulate(public_key_b64: string): any;
/**
* @param {string} shared_secret_b64
* @returns {string}
*/
export function derive_aes_key(shared_secret_b64: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decapsulate: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly derive_aes_key: (a: number, b: number, c: number) => void;
  readonly encapsulate: (a: number, b: number) => number;
  readonly keygen: () => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
