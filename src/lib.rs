use wasm_bindgen::prelude::*;
use base64::{engine::general_purpose, Engine as _};

use ml_kem::{MlKem768, KemCore};
use ml_kem::kem::{EncapsulationKey, DecapsulationKey, Encapsulate, Decapsulate};
use ml_kem::EncodedSizeUser;

use hkdf::Hkdf;
use sha2::Sha256;

use rand_core::OsRng;
use js_sys::Object;

fn rng() -> OsRng {
    OsRng
}

#[wasm_bindgen]
pub fn keygen() -> JsValue {
    let (dk, ek) = MlKem768::generate(&mut rng());

    let pk_b64 = general_purpose::STANDARD.encode(ek.as_bytes());
    let sk_b64 = general_purpose::STANDARD.encode(dk.as_bytes());

    let obj = Object::new();
    js_sys::Reflect::set(&obj, &"public_key".into(), &pk_b64.into()).unwrap();
    js_sys::Reflect::set(&obj, &"secret_key".into(), &sk_b64.into()).unwrap();

    obj.into()
}

#[wasm_bindgen]
pub fn encapsulate(public_key_b64: String) -> JsValue {
    let pk_bytes = general_purpose::STANDARD
        .decode(public_key_b64)
        .expect("invalid base64 public key");

    let ek: <MlKem768 as KemCore>::EncapsulationKey = EncapsulationKey::from_bytes(
        pk_bytes.as_slice().try_into().expect("invalid public key length")
    );

    let (ct, ss) = ek.encapsulate(&mut rng()).expect("encapsulation failed");

    let ct_b64 = general_purpose::STANDARD.encode(&ct);
    let ss_b64 = general_purpose::STANDARD.encode(&ss);

    let obj = Object::new();
    js_sys::Reflect::set(&obj, &"ciphertext".into(), &ct_b64.into()).unwrap();
    js_sys::Reflect::set(&obj, &"shared_secret".into(), &ss_b64.into()).unwrap();

    obj.into()
}

#[wasm_bindgen]
pub fn decapsulate(ciphertext_b64: String, secret_key_b64: String) -> String {
    let ct_bytes = general_purpose::STANDARD
        .decode(ciphertext_b64)
        .expect("invalid ciphertext");

    let sk_bytes = general_purpose::STANDARD
        .decode(secret_key_b64)
        .expect("invalid secret key");

    let dk: <MlKem768 as KemCore>::DecapsulationKey = DecapsulationKey::from_bytes(
        sk_bytes.as_slice().try_into().expect("invalid secret key length")
    );

    let ct = ct_bytes.as_slice().try_into().expect("invalid ciphertext length");

    let ss = dk.decapsulate(ct).expect("decapsulation failed");

    general_purpose::STANDARD.encode(&ss)
}

#[wasm_bindgen]
pub fn derive_aes_key(shared_secret_b64: String) -> String {
    let ss = general_purpose::STANDARD
        .decode(shared_secret_b64)
        .expect("invalid shared secret");

    let hk = Hkdf::<Sha256>::new(None, &ss);

    let mut okm = [0u8; 32];
    hk.expand(b"ml-kem demo aes-gcm key", &mut okm)
        .expect("hkdf expand failed");

    general_purpose::STANDARD.encode(okm)
}
