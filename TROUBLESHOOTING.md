# Troubleshooting WebAssembly Table.grow() Error

## The Error
```
RangeError: WebAssembly.Table.grow(): failed to grow table by 4
```

This error occurs during WASM initialization and is related to WebAssembly reference types support.

## Solutions

### Solution 1: Use a Modern Browser (Recommended)

Ensure you're using an up-to-date browser with full WebAssembly support:

- **Chrome/Edge**: Version 119+ (November 2023 or later)
- **Firefox**: Version 120+ (November 2023 or later)
- **Safari**: Version 17.2+ (December 2023 or later)

**To check your browser version:**
- Chrome/Edge: `chrome://version` or `edge://version`
- Firefox: Menu → Help → About Firefox
- Safari: Safari → About Safari

### Solution 2: Try a Different Browser

If updating isn't possible, try these browsers in order:
1. Google Chrome (latest)
2. Mozilla Firefox (latest)
3. Microsoft Edge (latest)

### Solution 3: Clear Browser Cache

Sometimes cached WASM files cause issues:

1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: Settings → Privacy → Clear browsing data → Cached images and files

### Solution 4: Disable Browser Extensions

Some extensions interfere with WebAssembly:
1. Open browser in Incognito/Private mode
2. Navigate to `http://localhost:8080`
3. Test if it works

### Solution 5: Check Console for Detailed Errors

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for additional error messages
4. Share these with support if needed

## Technical Background

This error is caused by:
- **wasm-bindgen 0.2.108** using WebAssembly reference types
- Reference types require the browser to support growing WebAssembly tables
- Older browsers or browsers with disabled features may fail

## For Developers: Downgrade wasm-bindgen

If you need maximum compatibility, you can rebuild with an older wasm-bindgen version:

```bash
# Edit Cargo.toml
# Change: wasm-bindgen = "0.2.84"
# To: wasm-bindgen = "= 0.2.84"

# Clean and rebuild
rm -rf pkg target
source ~/.cargo/env
wasm-pack build --target web
```

Version 0.2.84 doesn't use reference types by default.

## Still Not Working?

If none of these solutions work, please provide:
1. Browser name and version
2. Operating system
3. Full error message from console
4. Screenshot of the error

## Alternative: Use the CLI Version

If the web app doesn't work, you can use the Rust library directly:

```rust
use ml_kem::{MlKem768, KemCore};

fn main() {
    let (dk, ek) = MlKem768::generate(&mut OsRng);
    println!("Keys generated successfully!");
}
```
