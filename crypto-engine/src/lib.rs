mod node;

use wasm_bindgen::prelude::*;
use node::Node;
use bit_vec::BitVec; 


pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn test_xor_operation() {
        let mut xor_node = Node::new_xor(1, 4);

        xor_node.inputs[0].data = BitVec::from_bytes(&[0b10100000]); 
        xor_node.inputs[1].data = BitVec::from_bytes(&[0b11000000]);

        xor_node.process();

        let expected = BitVec::from_bytes(&[0b01100000]);
        assert_eq!(xor_node.outputs[0].data, expected);
    }
    #[test]
    fn test_node_serialization_cycle() {
        // 1. Create a real XOR node
        let original_node = Node::new_xor(1, 8);

        // 2. Serialize: Convert the Node struct into a JSON string
        let json_data = serde_json::to_string(&original_node)
            .expect("Failed to serialize node");

        // Optional: Print it to see what the data looks like
        println!("Serialized JSON: {}", json_data);

        // 3. Deserialize: Convert the JSON string back into a Node struct
        let deserialized_node: Node = serde_json::from_str(&json_data)
            .expect("Failed to deserialize node");

        // 4. Assert: Check if the data survived the round trip
        assert_eq!(original_node.id, deserialized_node.id);
        assert_eq!(original_node.name, deserialized_node.name);
        assert_eq!(original_node.inputs.len(), deserialized_node.inputs.len());
        
        // Check if the bit data is intact
        assert_eq!(original_node.inputs[0].data, deserialized_node.inputs[0].data);
    }
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
