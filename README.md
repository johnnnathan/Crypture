# Crypture the Flag

Crypture the Flag is an educational platform that teaches core cryptographic concepts through a series of theoretical and practical exercises. The project puts an emphasis of teaching through simulations, allowing students to interact and experiment with cryptographic schemes.

## Prerequisites

Prerequisites to run:
- [Docker](https://www.docker.com/)

```
docker build -t crypture .
docker run -p 8080:80 crypture
```

Visit http://localhost:8080

Prerequisites to develop:
- [Rust](https://rust-lang.org/) for engine development
- [wasm-pack](https://wasm-bindgen.github.io/wasm-pack/) for engine translation
- [Python](https://python.org) for development server


## Project Layout


```
├── crypto-engine
│   ├── src             # Crypto-engine rust source code
│   └── pkg             # Crypto-engine translated code using wasm-pack
├── frontend
│   └── src             # Front-end source code
└── tools               # Variety of tools used during development

```

## Development

Common development tasks are available in the `tools` directory.

```bash
./tools/build_crypto.sh   # Build the WebAssembly crypto engine
./tools/test_crypto.sh    # Run crypto-engine tests
```
