use serde::{Serialize, Deserialize};
use rand::{Rng, thread_rng};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum OpType {
    Xor,
    SBox(Vec<u8>),
    Caesar,
    Vigenere,
}

impl OpType {
    pub fn get_spec(&self, base_width: u16) -> (Vec<u16>, Vec<u16>) {
        match self {
            OpType::Xor => (vec![base_width, base_width], vec![base_width]),
            OpType::SBox(_) => (vec![8], vec![8]),
            OpType::Caesar => (vec![base_width, 8], vec![base_width]),
            OpType::Vigenere => (vec![base_width, base_width, 16], vec![base_width]),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Port {
    pub id: u32,
    pub width: u16,
    pub data: Vec<u8>,
}

impl Port {
    pub fn new(id: u32, width: u16) -> Self {
        let bytes = (width as usize + 7) / 8;
        Self {
            id,
            width,
            data: vec![0u8; bytes],
        }
    }

    pub fn set_data(&mut self, new_data: Vec<u8>) {
        let expected = (self.width as usize + 7) / 8;
        if new_data.len() == expected {
            self.data = new_data;
        } else {
            eprintln!("Port width mismatch: expected {} bytes, got {}", expected, new_data.len());
        }
    }

    pub fn fill_random(&mut self) {
        let mut rng = thread_rng();
        let bytes_needed = (self.width as usize + 7) / 8;
        let mut random_bytes = vec![0u8; bytes_needed];
        rng.fill(&mut random_bytes[..]);

        // Mask unused bits in the last byte
        if self.width % 8 != 0 {
            if let Some(last) = random_bytes.last_mut() {
                let mask = (1u8 << (self.width % 8)) - 1;
                *last &= mask;
            }
        }
        self.data = random_bytes;
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Node {
    pub id: u32,
    pub name: String,
    pub op_type: OpType,
    pub inputs: Vec<u32>,
    pub outputs: Vec<u32>,
    pub internals: Option<Vec<Node>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Circuit {
    pub name: String,
    pub nodes: Vec<Node>,
    pub ports: Vec<Port>,
    pub connections: Vec<(u32, u32)>,
    next_port_id: u32,
}

impl Circuit {
    pub fn new(name: String) -> Self {
        Self {
            name,
            nodes: Vec::new(),
            ports: Vec::new(),
            connections: Vec::new(),
            next_port_id: 0,
        }
    }

    pub fn clear(&mut self) {
        self.nodes.clear();
        self.ports.clear();
        self.connections.clear();
        self.next_port_id = 0;
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_else(|e| format!("{{ \"error\": \"{}\" }}", e))
    }

    pub fn from_json(data: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(data)
    }

    fn generate_port_id(&mut self) -> u32 {
        let id = self.next_port_id;
        self.next_port_id += 1;
        id
    }

    pub fn add_node(&mut self, name: String, op: OpType, width: u16) {
        let node_id = self.nodes.len() as u32;
        let (in_widths, out_widths) = op.get_spec(width);

        let input_ids: Vec<u32> = in_widths
            .into_iter()
            .map(|w| {
                let pid = self.generate_port_id();
                self.ports.push(Port::new(pid, w));
                pid
            })
            .collect();

        let output_ids: Vec<u32> = out_widths
            .into_iter()
            .map(|w| {
                let pid = self.generate_port_id();
                self.ports.push(Port::new(pid, w));
                pid
            })
            .collect();

        self.nodes.push(Node {
            id: node_id,
            name,
            op_type: op,
            inputs: input_ids,
            outputs: output_ids,
            internals: None,
        });
    }

    pub fn add_connection(&mut self, from_port: u32, to_port: u32) {
        if from_port == to_port {
            return; // prevent self-loops
        }
        if !self.connections.contains(&(from_port, to_port)) {
            self.connections.push((from_port, to_port));
        }
    }

    pub fn remove_connection(&mut self, from_id: u32, to_id: u32) {
        self.connections.retain(|&(f, t)| !(f == from_id && t == to_id));
    }

    pub fn remove_node(&mut self, node_id: u32) {
        if let Some(pos) = self.nodes.iter().position(|n| n.id == node_id) {
            let node = self.nodes.remove(pos);
            let mut ports_to_remove = node.inputs;
            ports_to_remove.extend(node.outputs);

            // Remove connections involving these ports
            self.connections.retain(|(f, t)| {
                !ports_to_remove.contains(f) && !ports_to_remove.contains(t)
            });

            // Remove ports
            self.ports.retain(|p| !ports_to_remove.contains(&p.id));
        }
    }

    pub fn remove_port(&mut self, port_id: u32) {
        self.ports.retain(|p| p.id != port_id);
        self.connections.retain(|(f, t)| *f != port_id && *t != port_id);

        for node in &mut self.nodes {
            node.inputs.retain(|&id| id != port_id);
            node.outputs.retain(|&id| id != port_id);
        }
    }

    // === Execution ===

    pub fn set_port_data(&mut self, port_id: u32, data: Vec<u8>) {
        if let Some(port) = self.ports.iter_mut().find(|p| p.id == port_id) {
            port.set_data(data);
        }
    }

    pub fn get_port_data(&self, id: u32) -> Option<Vec<u8>> {
        self.ports.iter().find(|p| p.id == id).map(|p| p.data.clone())
    }

    pub fn fill_random(&mut self, port_id: u32) {
        if let Some(port) = self.ports.iter_mut().find(|p| p.id == port_id) {
            port.fill_random();
        }
    }

    pub fn iterate(&mut self) {
        let output_port_ids: Vec<u32> = self.nodes
            .iter()
            .flat_map(|n| n.outputs.clone())
            .collect();

        for port_id in output_port_ids {
            self.pull_data(port_id);
        }
    }

    // Demand-driven evaluation
    pub fn pull_data(&mut self, port_id: u32) -> Vec<u8> {
        let mut visited = HashSet::new();
        self.pull_recursive(port_id, &mut visited)
    }

    fn pull_recursive(&mut self, port_id: u32, visited: &mut HashSet<u32>) -> Vec<u8> {
        if !visited.insert(port_id) {
            return self.get_port_data(port_id).unwrap_or_default();
        }

        // Pull from source if this is a connected input
        if let Some(source_id) = self.find_connection_source(port_id) {
            let data = self.pull_recursive(source_id, visited);
            if let Some(port) = self.ports.iter_mut().find(|p| p.id == port_id) {
                port.set_data(data.clone());
            }
            return data;
        }

        // If this is an output port → compute the node
        if let Some(node_idx) = self.find_node_idx_by_output(port_id) {
            self.run_node_demand_driven(node_idx, visited);
        }

        self.get_port_data(port_id).unwrap_or_default()
    }

    fn run_node_demand_driven(&mut self, node_idx: usize, visited: &mut HashSet<u32>) {
        let input_ids = self.nodes[node_idx].inputs.clone();
        for in_id in input_ids {
            self.pull_recursive(in_id, visited);
        }
        self.run_node(node_idx);
    }

    fn run_node(&mut self, node_idx: usize) {
        let node = &self.nodes[node_idx];
        let optype = node.op_type.clone();
        let inputs = node.inputs.clone();
        let outputs = node.outputs.clone();

        match optype {
            OpType::Xor => self.op_xor(&inputs, &outputs),
            OpType::SBox(table) => self.op_sbox(&inputs, &outputs, &table),
            OpType::Caesar => self.op_caesar(&inputs, &outputs),
            OpType::Vigenere => self.op_vigenere(&inputs, &outputs),
        }
    }

    // ... (op_xor, op_sbox, op_caesar, op_vigenere implementations remain the same)
    // I'll keep them unchanged unless you want further optimization.
    fn op_xor(&mut self, inputs: &[u32], outputs: &[u32]) { /* unchanged */ }
    fn op_sbox(&mut self, inputs: &[u32], outputs: &[u32], table: &[u8]) { /* unchanged */ }
    fn op_caesar(&mut self, inputs: &[u32], outputs: &[u32]) { /* unchanged */ }
    fn op_vigenere(&mut self, inputs: &[u32], outputs: &[u32]) { /* unchanged */ }

    // Helper methods (unchanged)
    fn find_node_idx_by_output(&self, port_id: u32) -> Option<usize> {
        self.nodes.iter().position(|n| n.outputs.contains(&port_id))
    }

    fn find_connection_source(&self, to_port_id: u32) -> Option<u32> {
        self.connections.iter()
            .find(|(_, to)| *to == to_port_id)
            .map(|(from, _)| *from)
    }
}

// ==================== WASM BINDING ====================

#[wasm_bindgen]
pub struct CircuitWasm {
    inner: Circuit,
}

#[wasm_bindgen]
impl CircuitWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String) -> Self {
        Self { inner: Circuit::new(name) }
    }

    pub fn clear(&mut self) {
        self.inner.clear();
    }

    pub fn add_node(&mut self, name: String, op_js: JsValue, width: u16) {
        let op: OpType = serde_wasm_bindgen::from_value(op_js)
            .expect("Failed to deserialize OpType");
        self.inner.add_node(name, op, width);
    }

    pub fn add_connection(&mut self, from_id: u32, to_id: u32) {
        self.inner.add_connection(from_id, to_id);
    }

    pub fn remove_connection(&mut self, from_id: u32, to_id: u32) {
        self.inner.remove_connection(from_id, to_id);
    }

    pub fn remove_node(&mut self, node_id: u32) {
        self.inner.remove_node(node_id);
    }

    pub fn remove_port(&mut self, port_id: u32) {
        self.inner.remove_port(port_id);
    }

    pub fn set_port_data(&mut self, port_id: u32, data: Vec<u8>) {
        self.inner.set_port_data(port_id, data);
    }

    pub fn fill_random(&mut self, port_id: u32) {
        self.inner.fill_random(port_id);
    }

    pub fn pull_data(&mut self, port_id: u32) -> Vec<u8> {
        self.inner.pull_data(port_id)
    }

    pub fn iterate(&mut self) {
        self.inner.iterate();
    }

    pub fn to_json(&self) -> String {
        self.inner.to_json()
    }
}
