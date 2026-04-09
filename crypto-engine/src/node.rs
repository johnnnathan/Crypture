use bit_vec::BitVec;
use serde::{Serialize, Deserialize};
use rand::Rng;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum PortRole {
    Data,
    Key,
    Nonce,
    Metadata,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum OpType {
    Xor,
    SBox(Vec<u8>),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Port {
    pub id: u32,
    pub role: PortRole,
    pub width: u16,
    pub data: BitVec,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Node {
    pub id: u32,
    pub name: String,
    pub op_type: OpType,
    pub inputs: Vec<Port>,
    pub outputs: Vec<Port>,
    pub internals: Option<Vec<Node>>,
}

impl Node {
    pub fn new_xor(id: u32, width: u16) -> Self {
        let p1 = Port { id: 1, role: PortRole::Data, width, data: BitVec::from_elem(width as usize, false) };
        let p2 = Port { id: 2, role: PortRole::Data, width, data: BitVec::from_elem(width as usize, false) };
        let p_out = Port { id: 3, role: PortRole::Data, width, data: BitVec::from_elem(width as usize, false) };

        Node {
            id,
            name: "XOR".to_string(),
            op_type: OpType::Xor,
            inputs: vec![p1, p2],
            outputs: vec![p_out],
            internals: None,
        }
    }
    
    // Make sure your process function is also there!
    pub fn process(&mut self) {
        match &self.op_type {
            OpType::Xor => {
                let mut result = self.inputs[0].data.clone();
                result.xor(&self.inputs[1].data);
                self.outputs[0].data = result;
            },
            _ => {}
        }
    }
}

impl Port {
    // Constructor
    pub fn new(id: u32, role: PortRole, width: u16) -> Self {
        Self {
            id,
            role,
            width,
            data: BitVec::from_elem(width as usize, false),
        }
    }

    // Getters
    pub fn get_data(&self) -> &BitVec { &self.data }
    pub fn get_width(&self) -> u16 { self.width }

    // Setters
    pub fn set_data(&mut self, new_data: BitVec) {
        if new_data.len() == self.width as usize {
            self.data = new_data;
        }
    }

    /// Generates random bits for this port based on its width
    pub fn fill_random(&mut self) {
        let mut rng = rand::thread_rng();
        let bytes_needed = (self.width as f32 / 8.0).ceil() as usize;
        let mut random_bytes = vec![0u8; bytes_needed];
        rng.fill(&mut random_bytes[..]);
        
        let mut new_bv = BitVec::from_bytes(&random_bytes);
        new_bv.truncate(self.width as usize);
        self.data = new_bv;
    }
}
