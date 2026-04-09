use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: u32,
    pub name: String,
    pub inputs: Vec<BitVec>,
    pub outputs: Vec<BitVec>,
    pub internals: Option<Vec<Node>>,
}

impl Node {
    pub fn new(
        id: u8,
        name: String,
        input_sizes: Vec<u16>,
        output_sizes: Vec<u16>,
        inputs: Vec<Vec<u8>>,
        outputs: Vec<Vec<u8>>,
        internals: Option<Vec<Node>>,
    ) -> Self {
        Node {
            id,
            name,
            input_sizes,
            output_sizes,
            inputs,
            outputs,
            internals,
        }
    }
}
