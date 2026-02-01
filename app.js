// Import the WASM module
import init, { keygen, encapsulate, decapsulate, derive_aes_key } from './pkg/mlkem_wasm.js';

// Global state
let wasmReady = false;
let currentAesKey = null;

// Initialize WASM
async function initWasm() {
    try {
        // Explicitly pass the WASM file URL
        await init('./pkg/mlkem_wasm_bg.wasm');
        wasmReady = true;
        console.log('WASM module loaded successfully');
        enableButtons();
    } catch (error) {
        console.error('Failed to load WASM module:', error);

        // Provide helpful error message based on error type
        if (error.message && error.message.includes('Table.grow')) {
            alert('WebAssembly initialization error. This may be due to:\n' +
                  '1. Browser compatibility (try Chrome, Firefox, or Edge latest version)\n' +
                  '2. Memory limitations\n' +
                  '3. Try refreshing the page\n\n' +
                  'Technical details: ' + error.message);
        } else {
            alert('Failed to load cryptography module: ' + error.message + '\n\nPlease refresh the page.');
        }
    }
}

// Enable buttons after WASM is loaded
function enableButtons() {
    document.getElementById('generateKeysBtn').disabled = false;
    document.getElementById('encapsulateBtn').disabled = false;
    document.getElementById('decapsulateBtn').disabled = false;
    document.getElementById('encryptBtn').disabled = false;
    document.getElementById('decryptBtn').disabled = false;
}

// Disable buttons initially
function disableButtons() {
    document.getElementById('generateKeysBtn').disabled = true;
    document.getElementById('encapsulateBtn').disabled = true;
    document.getElementById('decapsulateBtn').disabled = true;
    document.getElementById('encryptBtn').disabled = true;
    document.getElementById('decryptBtn').disabled = true;
}

// Copy to clipboard helper
window.copyToClipboard = function(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');

    // Visual feedback
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#d4edda';
    setTimeout(() => {
        element.style.backgroundColor = originalBg;
    }, 300);
};

// User A: Generate keypair
document.getElementById('generateKeysBtn').addEventListener('click', () => {
    if (!wasmReady) {
        alert('WASM module not ready yet');
        return;
    }

    try {
        const keys = keygen();
        document.getElementById('publicKeyA').value = keys.public_key;
        document.getElementById('secretKeyA').value = keys.secret_key;
        showSuccess('Keys generated successfully! Share the public key with User B.');
    } catch (error) {
        console.error('Key generation error:', error);
        showError('Failed to generate keys: ' + error.message);
    }
});

// User B: Encapsulate
document.getElementById('encapsulateBtn').addEventListener('click', () => {
    if (!wasmReady) {
        alert('WASM module not ready yet');
        return;
    }

    const publicKey = document.getElementById('publicKeyInput').value.trim();

    if (!publicKey) {
        showError('Please paste User A\'s public key first');
        return;
    }

    try {
        const result = encapsulate(publicKey);
        document.getElementById('ciphertextOutput').value = result.ciphertext;
        document.getElementById('sharedSecretB').value = result.shared_secret;

        // Derive AES key for User B
        const aesKeyB64 = derive_aes_key(result.shared_secret);
        currentAesKey = aesKeyB64;

        showSuccess('Encapsulation successful! Send the ciphertext to User A.');
    } catch (error) {
        console.error('Encapsulation error:', error);
        showError('Failed to encapsulate: ' + error.message);
    }
});

// User A: Decapsulate
document.getElementById('decapsulateBtn').addEventListener('click', () => {
    if (!wasmReady) {
        alert('WASM module not ready yet');
        return;
    }

    const ciphertext = document.getElementById('ciphertextInput').value.trim();
    const secretKey = document.getElementById('secretKeyA').value.trim();

    if (!ciphertext) {
        showError('Please paste the ciphertext from User B');
        return;
    }

    if (!secretKey) {
        showError('Please generate keys first');
        return;
    }

    try {
        const sharedSecret = decapsulate(ciphertext, secretKey);
        document.getElementById('sharedSecretA').value = sharedSecret;

        // Derive AES key for User A
        const aesKeyB64 = derive_aes_key(sharedSecret);
        currentAesKey = aesKeyB64;

        showSuccess('Decapsulation successful! Both users now have the same shared secret.');
    } catch (error) {
        console.error('Decapsulation error:', error);
        showError('Failed to decapsulate: ' + error.message);
    }
});

// Encrypt message
document.getElementById('encryptBtn').addEventListener('click', async () => {
    if (!currentAesKey) {
        showError('Please complete the key exchange first (both users need the shared secret)');
        return;
    }

    const plaintext = document.getElementById('plaintextInput').value;

    if (!plaintext) {
        showError('Please enter a message to encrypt');
        return;
    }

    try {
        const encrypted = await encryptMessage(plaintext, currentAesKey);
        document.getElementById('encryptedOutput').value = encrypted;
        showSuccess('Message encrypted successfully!');
    } catch (error) {
        console.error('Encryption error:', error);
        showError('Failed to encrypt: ' + error.message);
    }
});

// Decrypt message
document.getElementById('decryptBtn').addEventListener('click', async () => {
    if (!currentAesKey) {
        showError('Please complete the key exchange first (both users need the shared secret)');
        return;
    }

    const encrypted = document.getElementById('encryptedInput').value.trim();

    if (!encrypted) {
        showError('Please paste an encrypted message');
        return;
    }

    try {
        const decrypted = await decryptMessage(encrypted, currentAesKey);
        document.getElementById('decryptedOutput').value = decrypted;
        showSuccess('Message decrypted successfully!');
    } catch (error) {
        console.error('Decryption error:', error);
        showError('Failed to decrypt: ' + error.message);
    }
});

// AES-GCM Encryption
async function encryptMessage(plaintext, aesKeyB64) {
    // Get crypto object (for compatibility)
    const cryptoObj = window.crypto || window.msCrypto;
    if (!cryptoObj || !cryptoObj.subtle) {
        throw new Error('Web Crypto API not available. Please use HTTPS or a modern browser.');
    }

    // Decode base64 AES key
    const aesKeyBytes = base64ToArrayBuffer(aesKeyB64);

    // Import AES key
    const cryptoKey = await cryptoObj.subtle.importKey(
        'raw',
        aesKeyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    // Generate random IV (12 bytes for GCM)
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));

    // Encode plaintext
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    // Encrypt
    const ciphertext = await cryptoObj.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        plaintextBytes
    );

    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return arrayBufferToBase64(combined);
}

// AES-GCM Decryption
async function decryptMessage(encryptedB64, aesKeyB64) {
    // Get crypto object (for compatibility)
    const cryptoObj = window.crypto || window.msCrypto;
    if (!cryptoObj || !cryptoObj.subtle) {
        throw new Error('Web Crypto API not available. Please use HTTPS or a modern browser.');
    }

    // Decode base64
    const combined = base64ToArrayBuffer(encryptedB64);
    const combinedArray = new Uint8Array(combined);

    // Extract IV and ciphertext
    const iv = combinedArray.slice(0, 12);
    const ciphertext = combinedArray.slice(12);

    // Decode base64 AES key
    const aesKeyBytes = base64ToArrayBuffer(aesKeyB64);

    // Import AES key
    const cryptoKey = await cryptoObj.subtle.importKey(
        'raw',
        aesKeyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );

    // Decrypt
    const decrypted = await cryptoObj.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        ciphertext
    );

    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Helper: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// UI Feedback
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Initialize on page load
disableButtons();
initWasm();
