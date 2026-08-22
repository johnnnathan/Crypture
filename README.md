# Crypture the Flag

Crypture the Flag is an educational platform that teaches core cryptographic concepts through a series of theoretical and practical exercises. The project puts an emphasis of teaching through simulations, allowing students to interact and experiment with cryptographic schemes.

## Requirements 


To install requirements:
```
chmod +x ./tools/install.sh
./tools/install.sh
```
or 
```
pip install -r requirements.txt
```

Prerequisites to develop:
- [Rust](https://rust-lang.org/) for engine development
- [wasm-pack](https://wasm-bindgen.github.io/wasm-pack/) for engine translation
- [Python](https://python.org) for development server


## Running the Project 

Start server:
```
chmod +x ./tools/run_server.sh
./tools/run_server.sh
```

then visit http://localhost:8000

## Project Layout


```
├── challenge-engine/         
│   ├── src/                  # Rust implementations for challenge backends
│   └── python/               # Python implementations for challenge backends
├── crypto-engine/            
│   ├── src/                  # Native Rust cryptographic code
│   └── pkg/                  # WebAssembly bindings generated via wasm-pack
├── frontend/                 
│   └── app/                  # Frontend application source code
├── tools/                    # Shell and Python scripts for setup, building, and testing
├── Dockerfile                # Container setup for unified deployment
└── requirements.txt          # Python dependencies

```

## Development

Common development tasks are available in the `tools` directory.

```bash
./tools/setup.sh            # Build the backend engines of the project 
./tools/test_engine.sh      # Run engine tests
./tools/install.sh          # Install project dependencies
```
