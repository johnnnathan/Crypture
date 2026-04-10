use bit_vec::BitVec;
use serde::{Serialize, Deserialize};
use rand::Rng;
use std::collections::HashSet;


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
            OpType::Vigenere => (vec![base_width, 8], vec![base_width]),
        }
    }
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Port {
    pub id: u32,
    pub width: u16,
    pub data: BitVec,
}

impl Port {
    // Constructor
    pub fn new(id: u32, width: u16) -> Self {
        Self {
            id,
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



#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Node {
    pub id: u32,
    pub name: String,
    pub op_type: OpType,
    pub inputs: Vec<u32>,
    pub outputs: Vec<u32>,
    pub internals: Option<Vec<Node>>,
}
impl Node {
    pub fn new_xor(id: u32, width: u16) -> Self {
        Node {
            id,
            name: "XOR".to_string(),
            op_type: OpType::Xor,
            inputs: Vec::new(),
            outputs: Vec::new(),
            internals: None,
        }
    }

    pub fn get_name(&self) -> &String {
        &self.name
    }
    pub fn get_input_ports(&self) -> &Vec<u32> {
        &self.inputs
    }
    pub fn get_output_ports(&self) -> &Vec<u32> {
        &self.outputs
    }
    pub fn get_optype(&self) -> &OpType {
        return &self.op_type;
    }

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

    pub fn new(name: String) -> Self{
        Self {
            name,
            nodes: Vec::new(),
            ports: Vec::new(),
            connections: Vec::new(),
            next_port_id: 0,
        }
    }
    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap()
    }

    pub fn from_json(data: &str) -> Self {
        serde_json::from_str(data).unwrap()
    }

    fn add_port(&mut self, port: Port){
        self.ports.push(port);
    }
    pub fn add_node(&mut self, name: String, op: OpType, width: u16) {
        let node_id = self.nodes.len() as u32;
        let (in_widths, out_widths) = op.get_spec(width);

        let mut input_ids = Vec::new();
        for w in in_widths {
            let p_id = self.generate_port_id();
            self.add_port(Port::new(p_id, w));
            input_ids.push(p_id);
        }

        let mut output_ids = Vec::new();
        for w in out_widths {
            let p_id = self.generate_port_id();
            self.add_port(Port::new(p_id, w));
            output_ids.push(p_id);
        }

        self.nodes.push(Node {
            id: node_id,
            name,
            op_type: op,
            inputs: input_ids,
            outputs: output_ids,
            internals: None,
        });
    }

        fn generate_port_id(&mut self) -> u32 {
            let id = self.next_port_id;
            self.next_port_id += 1;
            id
        }

    pub fn add_connection(&mut self, from_port: u32, to_port: u32){
        if !self.connections.contains(&(from_port, to_port)) {
            self.connections.push((from_port,to_port));
        }
        
    }

    pub fn get_port_data(&self, id: u32) -> Option<BitVec> {
        self.ports.iter().find(|p| p.id == id).map(|p| p.data.clone())
    }

    pub fn get_port_mut(&mut self, id: u32) -> Option<&mut Port> {
        self.ports.iter_mut().find(|p| p.id == id)
    }
    fn get_node(&self, idx: usize) -> &Node {
        return &self.nodes[idx];
    }

    fn get_node_blueprint(&self, node_idx: usize) -> (OpType, Vec<u32>, Vec<u32>) {
        let node = self.get_node(node_idx);
        (node.get_optype().clone(), node.get_input_ports().clone(), node.get_output_ports().clone())
    }

    fn op_xor(&mut self, inputs: &[u32], outputs: &[u32]){
        let val0 = self.get_port_data(inputs[0]);
        let val1 = self.get_port_data(inputs[1]);

        if let (Some(v0), Some(v1)) = (val0, val1){
            let mut result = v0;
            result.xor(&v1);
            if let Some(out_port) = self.get_port_mut(outputs[0]) {
                out_port.set_data(result);
            }
        }
    }
    fn op_sbox(&mut self, inputs: &[u32], outputs: &[u32], table: &[u8]) {
        // 1. Get the input data
        if let Some(in_data) = self.get_port_data(inputs[0]) {
            // 2. Convert BitVec to index (usize)
            // Note: For an 8-bit S-Box, we look at the first byte
            let bytes = in_data.to_bytes();
            if let Some(&input_val) = bytes.get(0) {
                let index = input_val as usize;

                // 3. Lookup the value in the table
                if let Some(&output_val) = table.get(index) {
                    let result = BitVec::from_bytes(&[output_val]);
                    
                    // 4. Set the output port
                    if let Some(out_port) = self.get_port_mut(outputs[0]) {
                        out_port.set_data(result);
                    }
                }
            }
        }
    }

    fn op_caesar(&mut self, inputs: &[u32], outputs: &[u32]) {
        let val_data = self.get_port_data(inputs[0]);
        let val_shift = self.get_port_data(inputs[1]);

        if let (Some(v_d), Some(v_s)) = (val_data, val_shift) {
            // 1. Get the byte to be shifted
            let data_byte = v_d.to_bytes()[0];
            // 2. Get the shift amount (the key)
            let shift_byte = v_s.to_bytes()[0];

            // 3. Perform the wrapping add (Caesar math)
            let result_byte = data_byte.wrapping_add(shift_byte);
            let result = BitVec::from_bytes(&[result_byte]);

            // 4. Set the output
            if let Some(out_port) = self.get_port_mut(outputs[0]) {
                out_port.set_data(result);
            }
        }
    }
    fn op_vigenere(&mut self, inputs: &[u32], outputs: &[u32]) {
        let val_data = self.get_port_data(inputs[0]);
        let val_key = self.get_port_data(inputs[1]);

        if let (Some(v_d), Some(v_k)) = (val_data, val_key) {
            let data_bytes = v_d.to_bytes();
            let key_bytes = v_k.to_bytes();
            
            // Safety: If the key is empty, we can't divide by zero.
            if key_bytes.is_empty() { return; }

            let result_bytes: Vec<u8> = data_bytes
                .iter()
                .enumerate()
                .map(|(i, &byte)| {
                    // This is the "Repeating" magic:
                    // i = 0 -> key[0]
                    // i = 1 -> key[1]
                    // i = 2 -> key[0] (if key len is 2)
                    let shift = key_bytes[i % key_bytes.len()];
                    byte.wrapping_add(shift)
                })
                .collect();

            if let Some(out_port) = self.get_port_mut(outputs[0]) {
                out_port.set_data(BitVec::from_bytes(&result_bytes));
            }
        }
    }

    pub fn run_node(&mut self, node_idx: usize) {

        let (optype, inputs, outputs) = self.get_node_blueprint(node_idx);
        match optype {
            OpType::Xor => self.op_xor(&inputs, &outputs),
            OpType::SBox(table) => self.op_sbox(&inputs, &outputs, &table),
            OpType::Caesar => self.op_caesar(&inputs, &outputs),
            OpType::Vigenere => self.op_vigenere(&inputs, &outputs),
        }
    }

    pub fn run_node_by_id(&mut self, node_id: u32){
        if let Some(idx) = self.nodes.iter().position(|n| n.id == node_id){
            self.run_node(idx);
        }
    }

    pub fn propagate_connections(&mut self) {
        let paths: Vec<(u32, u32)> = self.connections.clone();

        for (from_id, to_id) in paths {
            if let Some(data) = self.get_port_data(from_id) {
                if let Some(to_port) = self.get_port_mut(to_id) {
                    to_port.set_data(data);
                }
            }
        }
    }
    pub fn remove_connection(&mut self, from_id: u32, to_id: u32) {
        self.connections.retain(|&(f, t)| f != from_id || t != to_id);
    }
    pub fn remove_port(&mut self, port_id: u32) {
        // Remove the port itself
        self.ports.retain(|p| p.id != port_id);
        
        // Remove any connections using this port
        self.connections.retain(|(from, to)| *from != port_id && *to != port_id);
        
        // Update nodes to remove the reference to this port ID
        for node in &mut self.nodes {
            node.inputs.retain(|&id| id != port_id);
            node.outputs.retain(|&id| id != port_id);
        }
    }

    pub fn remove_node(&mut self, node_id: u32) {
        // 1. Find the node to get its port IDs
        if let Some(pos) = self.nodes.iter().position(|n| n.id == node_id) {
            let node = self.nodes.remove(pos);
            
            // 2. Collect all port IDs associated with this node
            let mut ports_to_remove = node.inputs;
            ports_to_remove.extend(node.outputs);

            // 3. Remove all connections tied to these ports
            self.connections.retain(|(from, to)| {
                !ports_to_remove.contains(from) && !ports_to_remove.contains(to)
            });

            // 4. Remove the ports from the circuit
            self.ports.retain(|p| !ports_to_remove.contains(&p.id));
        }
    }

    pub fn pull_data(&mut self, port_id: u32) -> BitVec {
        let mut visited = HashSet::new();
        self.pull_recursive(port_id, &mut visited)
    }

    fn pull_recursive(&mut self, port_id: u32, visited: &mut HashSet<u32>) -> BitVec {
        if !visited.insert(port_id) {
            return self.get_port_data(port_id).unwrap_or_else(|| BitVec::from_elem(8, false));
        }

        // 1. If this is an input port, pull from source AND write to this port
        if let Some(source_id) = self.find_connection_source(port_id) {
            let source_data = self.pull_recursive(source_id, visited);
            
            // We must sync the data across the 'wire' before returning
            if let Some(this_port) = self.get_port_mut(port_id) {
                this_port.set_data(source_data.clone());
            }
            return source_data;
        }

        // 2. If this is an output port, trigger the node to update it
        if let Some(node_idx) = self.find_node_idx_by_output(port_id) {
            self.run_node_demand_driven(node_idx, visited);
        }

        self.get_port_data(port_id).unwrap_or_else(|| BitVec::from_elem(8, false))
    }

    fn run_node_demand_driven(&mut self, node_idx: usize, visited: &mut HashSet<u32>) {
        // Get the IDs for the inputs of this node
        let input_ids = self.nodes[node_idx].inputs.clone();
        
        // RECURSION: Pull data for every input of this node before executing the node logic
        for in_id in input_ids {
            self.pull_recursive(in_id, visited);
        }

        // Now that inputs are refreshed, execute the node's math
        self.run_node(node_idx);
    }

    // Helper: Find which node owns this port as an output
    fn find_node_idx_by_output(&self, port_id: u32) -> Option<usize> {
        self.nodes.iter().position(|n| n.outputs.contains(&port_id))
    }

    // Helper: Find which port is connected to this input port
    fn find_connection_source(&self, to_port_id: u32) -> Option<u32> {
        self.connections.iter()
            .find(|(_, to)| *to == to_port_id)
            .map(|(from, _)| *from)
    }

    pub fn iterate(&mut self) {
        // Find all ports that are outputs of nodes
        // We clone the IDs to avoid borrow checker issues while mutating self in the loop
        let output_port_ids: Vec<u32> = self.nodes
            .iter()
            .flat_map(|n| n.outputs.clone())
            .collect();

        for port_id in output_port_ids {
            self.pull_data(port_id);
        }
    }
    pub fn run_rounds(&mut self, rounds: usize) {
        for _ in 0..rounds {
            self.iterate();
        }
    }

}